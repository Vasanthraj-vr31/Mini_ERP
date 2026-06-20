"""ManufacturingService — MO state machine + BoM explosion.

Confirm  : pull components & operations from BoM, scale durations by qty.
Produce  : MO -> Done; consume components (-stock), add finished good (+stock).
"""
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.bom import BillOfMaterial
from app.models.manufacturing import ManufacturingOrder, MoComponent, MoWorkOrder
from app.models.enums import MOStatus
from app.services import sequence, inventory, audit


def build_mo_from_bom(db: Session, *, finished_product: Product, bom_id: int | None,
                      quantity: float, source: str = "", assignee_id: int | None = None,
                      reference: str | None = None) -> ManufacturingOrder:
    """Create a Draft MO and explode the BoM into components + work orders (qty-scaled)."""
    mo = ManufacturingOrder(
        reference=reference or sequence.next_ref(db, ManufacturingOrder, "MO"),
        finished_product_id=finished_product.id,
        bom_id=bom_id,
        quantity=quantity,
        assignee_id=assignee_id,
        status=MOStatus.draft.value,
        source=source,
    )
    bom = db.get(BillOfMaterial, bom_id) if bom_id else None
    if bom:
        per_unit = bom.quantity or 1.0
        factor = quantity / per_unit
        for comp in bom.components:
            mo.components.append(MoComponent(
                component_id=comp.component_id,
                to_consume_qty=round(comp.quantity * factor, 4),
                consumed_qty=0.0,
            ))
        for op in bom.operations:
            mo.work_orders.append(MoWorkOrder(
                operation=op.name,
                work_center_id=op.work_center_id,
                expected_duration=int(round(op.duration_minutes * factor)),
                status="Pending",
            ))
    return mo


def confirm(db: Session, mo: ManufacturingOrder, user=None) -> ManufacturingOrder:
    if mo.status != MOStatus.draft.value:
        raise HTTPException(400, f"Cannot confirm MO in status {mo.status}")
    mo.status = MOStatus.confirmed.value
    audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
              record_ref=mo.reference, action="Updated", field="status",
              old=MOStatus.draft.value, new=mo.status, user=user)
    return mo


def start(db: Session, mo: ManufacturingOrder, user=None) -> ManufacturingOrder:
    if mo.status not in (MOStatus.confirmed.value, MOStatus.in_progress.value):
        raise HTTPException(400, f"Cannot start MO in status {mo.status}")
    mo.status = MOStatus.in_progress.value
    for wo in mo.work_orders:
        if wo.status == "Pending":
            wo.status = "In-Progress"
    audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
              record_ref=mo.reference, action="Updated", field="status",
              old=MOStatus.confirmed.value, new=mo.status, user=user)
    return mo


def produce(db: Session, mo: ManufacturingOrder, user=None) -> ManufacturingOrder:
    """Mark Done: consume components, produce finished good, write ledger."""
    if mo.status in (MOStatus.done.value, MOStatus.cancelled.value):
        raise HTTPException(400, f"MO already {mo.status}")

    # consume components (use to_consume if consumed not manually set)
    for comp in mo.components:
        consume = comp.consumed_qty if comp.consumed_qty else comp.to_consume_qty
        comp.consumed_qty = consume
        if consume:
            inventory.record_move(db, comp.component, -consume, "MO-consume", mo.reference,
                                  f"Consumed for {mo.reference}")

    # produce finished good
    inventory.record_move(db, mo.finished_product, mo.quantity, "MO-produce", mo.reference,
                          f"Produced by {mo.reference}")

    for wo in mo.work_orders:
        wo.status = "Done"
        if not wo.real_duration:
            wo.real_duration = wo.expected_duration

    old = mo.status
    mo.status = MOStatus.done.value
    audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
              record_ref=mo.reference, action="Updated", field="status",
              old=old, new=mo.status, user=user)
    return mo


def cancel(db: Session, mo: ManufacturingOrder, user=None) -> ManufacturingOrder:
    if mo.status == MOStatus.done.value:
        raise HTTPException(400, "Cannot cancel a completed MO")
    old = mo.status
    mo.status = MOStatus.cancelled.value
    audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
              record_ref=mo.reference, action="Updated", field="status",
              old=old, new=mo.status, user=user)
    return mo
