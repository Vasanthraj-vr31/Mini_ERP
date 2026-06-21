"""PurchaseOrderService — PO state machine exactly per module-field-spec.

Draft -> Confirmed -> Partially Received -> Fully Received ; or -> Cancelled
Confirm : lock creation date/vendor/vendor address.
Receive : received==ordered -> Fully Received (all readonly, hide receive);
          received<ordered  -> Partially Received (only received qty editable, keep receive).
On receive, on-hand increases by the received increment.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.purchase import PurchaseOrder
from app.models.enums import POStatus
from app.services import inventory, audit


def confirm(db: Session, po: PurchaseOrder, user=None) -> PurchaseOrder:
    if po.status != POStatus.draft.value:
        raise HTTPException(400, f"Cannot confirm PO in status {po.status}")
    po.status = POStatus.confirmed.value
    audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
              action="Updated", field="status", old=POStatus.draft.value, new=po.status, user=user)
    return po


def receive(db: Session, po: PurchaseOrder, receipts: dict[int, float] | None = None, user=None) -> PurchaseOrder:
    if po.status not in (POStatus.confirmed.value, POStatus.partially_received.value):
        raise HTTPException(400, f"Cannot receive PO in status {po.status}")

    for line in po.lines:
        target = (receipts or {}).get(line.id, line.ordered_qty)
        target = min(max(target, line.received_qty or 0), line.ordered_qty)
        increment = round(target - (line.received_qty or 0), 4)
        if increment > 0 and line.product:
            inventory.record_move(db, line.product, increment, "PO", po.reference,
                                  f"Received on {po.reference}")
            audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
                      action="Updated", field="received_qty", old=line.received_qty,
                      new=target, user=user)
            line.received_qty = target

    fully = all((l.received_qty or 0) >= l.ordered_qty for l in po.lines)
    old = po.status
    po.status = POStatus.fully_received.value if fully else POStatus.partially_received.value
    audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
              action="Updated", field="status", old=old, new=po.status, user=user)
              
    if po.status == POStatus.fully_received.value and po.source:
        from app.services.sales import check_auto_dispatch
        check_auto_dispatch(db, po.source, user=user)
        
    return po


def cancel(db: Session, po: PurchaseOrder, user=None) -> PurchaseOrder:
    if po.status == POStatus.fully_received.value:
        raise HTTPException(400, "Cannot cancel a fully received order")
    old = po.status
    po.status = POStatus.cancelled.value
    audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
              action="Updated", field="status", old=old, new=po.status, user=user)
    return po
