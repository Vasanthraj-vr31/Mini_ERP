"""SalesOrderService — SO state machine exactly per module-field-spec.

Draft -> Confirmed -> Partially Delivered -> Fully Delivered ; or -> Cancelled
Confirm : lock creation date/customer/customer address; reserve; trigger procurement.
Deliver : delivered==ordered -> Fully Delivered (all readonly, hide deliver);
          delivered<ordered  -> Partially Delivered (only delivered qty editable, keep deliver).
Stock decreases by the delivered increment on each deliver.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.sales import SalesOrder
from app.models.enums import SOStatus
from app.services import inventory, audit


def process_customer_order(db: Session, so: SalesOrder, user=None) -> dict:
    from app.services import inventory, procurement
    if so.status not in (SOStatus.pending.value, SOStatus.backorder.value):
        raise HTTPException(400, f"Cannot process SO in status {so.status}")

    warnings = []
    procured = []
    
    is_mto = any(line.product.procure_on_demand for line in so.lines if line.product)
    has_shortage = False

    for line in so.lines:
        if not line.product:
            continue
        ftu = inventory.free_to_use(db, line.product)
        shortage = round(max(0.0, line.ordered_qty - ftu), 4)
        line.shortage_qty = shortage
        
        if shortage > 0:
            has_shortage = True
            if line.product.procure_on_demand:
                res = procurement.trigger_for_sales_order_line(db, so, line, shortage, user=user)
                if res:
                    procured.append(res)
            else:
                warnings.append({
                    "product": line.product.name,
                    "ordered": line.ordered_qty,
                    "free_to_use": ftu,
                    "shortfall": shortage
                })

    old_status = so.status
    if is_mto and has_shortage:
        so.status = SOStatus.pending_procurement.value
    elif has_shortage:
        so.status = SOStatus.out_of_stock.value if all(inventory.free_to_use(db, l.product) == 0 for l in so.lines if l.product) else SOStatus.backorder.value
    else:
        so.status = SOStatus.confirmed.value

    if old_status != so.status:
        audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
                  action="Updated", field="status", old=old_status, new=so.status, user=user)

    return {"warnings": warnings, "procured": procured}


def deliver(db: Session, so: SalesOrder, deliveries: dict[int, float] | None = None, user=None) -> SalesOrder:
    from app.services import inventory
    """deliveries = {line_id: delivered_qty_total}. If None, deliver everything."""
    if so.status in (SOStatus.dispatched.value, SOStatus.delivered.value):
        raise HTTPException(400, "Order is already dispatched or delivered")
    
    if so.status not in (SOStatus.confirmed.value, SOStatus.pending_procurement.value, SOStatus.backorder.value):
        raise HTTPException(400, f"Cannot dispatch SO in status {so.status}")

    for line in so.lines:
        target = (deliveries or {}).get(line.id, line.ordered_qty)
        target = min(max(target, line.delivered_qty or 0), line.ordered_qty)
        increment = round(target - (line.delivered_qty or 0), 4)
        
        if increment > 0 and line.product:
            if inventory.free_to_use(db, line.product) < increment:
                raise HTTPException(400, f"Not enough stock to dispatch {line.product.name}")
            inventory.record_move(db, line.product, -increment, "SO", so.reference,
                                  f"Dispatched on {so.reference}")
            audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
                      action="Updated", field="delivered_qty", old=line.delivered_qty,
                      new=target, user=user)
            line.delivered_qty = target

    fully = all((l.delivered_qty or 0) >= l.ordered_qty for l in so.lines)
    old = so.status
    so.status = SOStatus.delivered.value if fully else SOStatus.dispatched.value
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Updated", field="status", old=old, new=so.status, user=user)
    return so


def cancel(db: Session, so: SalesOrder, user=None) -> SalesOrder:
    if so.status in (SOStatus.delivered.value, SOStatus.dispatched.value):
        raise HTTPException(400, "Cannot cancel a delivered or dispatched order")
    old = so.status
    so.status = "CANCELLED"
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Updated", field="status", old=old, new=so.status, user=user)
    return so


def check_auto_dispatch(db: Session, source_tag: str, user=None):
    """Called after a PO is fully received or MO is done.
    Parses the source tag SO:{so_id}:L{line_id}, checks if the parent SO
    can now be fully dispatched, and if so, triggers deliver()."""
    try:
        parts = source_tag.split(":")
        so_id = int(parts[1])
    except (IndexError, ValueError):
        return

    so = db.get(SalesOrder, so_id)
    if not so or so.status not in (SOStatus.pending_procurement.value, SOStatus.backorder.value, SOStatus.confirmed.value):
        return

    # Check if all lines now have sufficient stock
    from app.services import inventory
    all_available = all(
        inventory.free_to_use(db, l.product) >= l.ordered_qty
        for l in so.lines if l.product
    )
    if all_available:
        deliver(db, so, deliveries=None, user=user)
