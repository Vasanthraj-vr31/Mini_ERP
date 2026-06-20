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


def confirm(db: Session, so: SalesOrder, user=None) -> dict:
    if so.status != SOStatus.draft.value:
        raise HTTPException(400, f"Cannot confirm SO in status {so.status}")

    # availability flag: ordered > free-to-use (per spec field 9)
    warnings = []
    for line in so.lines:
        if line.product:
            ftu = inventory.free_to_use(db, line.product)
            if (line.ordered_qty or 0) > ftu:
                warnings.append({
                    "product": line.product.name,
                    "ordered": line.ordered_qty,
                    "free_to_use": ftu,
                    "shortfall": round(line.ordered_qty - ftu, 4),
                })

    so.status = SOStatus.confirmed.value  # reservation now counted by inventory.reserved_for
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Updated", field="status", old=SOStatus.draft.value, new=so.status, user=user)

    # procurement automation runs after confirm (imported lazily to avoid cycle)
    from app.services import procurement
    procured = procurement.trigger_for_sales_order(db, so, user=user)
    return {"warnings": warnings, "procured": procured}


def deliver(db: Session, so: SalesOrder, deliveries: dict[int, float] | None = None, user=None) -> SalesOrder:
    """deliveries = {line_id: delivered_qty_total}. If None, deliver everything."""
    if so.status not in (SOStatus.confirmed.value, SOStatus.partially_delivered.value):
        raise HTTPException(400, f"Cannot deliver SO in status {so.status}")

    for line in so.lines:
        target = (deliveries or {}).get(line.id, line.ordered_qty)
        target = min(max(target, line.delivered_qty or 0), line.ordered_qty)
        increment = round(target - (line.delivered_qty or 0), 4)
        if increment > 0 and line.product:
            inventory.record_move(db, line.product, -increment, "SO", so.reference,
                                  f"Delivered on {so.reference}")
            audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
                      action="Updated", field="delivered_qty", old=line.delivered_qty,
                      new=target, user=user)
            line.delivered_qty = target

    fully = all((l.delivered_qty or 0) >= l.ordered_qty for l in so.lines)
    old = so.status
    so.status = SOStatus.fully_delivered.value if fully else SOStatus.partially_delivered.value
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Updated", field="status", old=old, new=so.status, user=user)
    return so


def cancel(db: Session, so: SalesOrder, user=None) -> SalesOrder:
    if so.status == SOStatus.fully_delivered.value:
        raise HTTPException(400, "Cannot cancel a fully delivered order")
    old = so.status
    so.status = SOStatus.cancelled.value
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Updated", field="status", old=old, new=so.status, user=user)
    return so
