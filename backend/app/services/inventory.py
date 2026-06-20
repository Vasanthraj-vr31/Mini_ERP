"""InventoryService — the single source of truth for stock.

on_hand  : physical stock, moved only via the StockLedger
reserved : committed but not yet shipped/consumed (Confirmed / In-Progress orders)
free_to_use = on_hand - reserved   (computed live, never stored)
"""
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.stock import StockLedger
from app.models.sales import SalesOrder, SaleOrderLine
from app.models.manufacturing import ManufacturingOrder, MoComponent
from app.models.enums import SOStatus, MOStatus


def record_move(db: Session, product: Product, qty_delta: float, source_type: str,
                source_ref: str = "", note: str = "") -> StockLedger:
    """Apply a stock movement atomically: update on_hand + append ledger row."""
    product.on_hand_qty = round((product.on_hand_qty or 0) + qty_delta, 4)
    entry = StockLedger(
        product_id=product.id,
        qty_delta=qty_delta,
        balance_after=product.on_hand_qty,
        source_type=source_type,
        source_ref=source_ref,
        note=note,
    )
    db.add(entry)
    return entry


def reserved_for(db: Session, product_id: int) -> float:
    """Reserved = open SO demand (ordered-delivered, not fully delivered, confirmed)
    + open MO component demand (to_consume-consumed, MO not Done, confirmed/in-progress)."""
    reserved = 0.0

    so_lines = (
        db.query(SaleOrderLine)
        .join(SalesOrder, SaleOrderLine.order_id == SalesOrder.id)
        .filter(
            SaleOrderLine.product_id == product_id,
            SalesOrder.status.in_([SOStatus.confirmed.value, SOStatus.partially_delivered.value]),
        )
        .all()
    )
    for l in so_lines:
        reserved += max((l.ordered_qty or 0) - (l.delivered_qty or 0), 0)

    mo_comps = (
        db.query(MoComponent)
        .join(ManufacturingOrder, MoComponent.mo_id == ManufacturingOrder.id)
        .filter(
            MoComponent.component_id == product_id,
            ManufacturingOrder.status.in_([MOStatus.confirmed.value, MOStatus.in_progress.value]),
        )
        .all()
    )
    for c in mo_comps:
        reserved += max((c.to_consume_qty or 0) - (c.consumed_qty or 0), 0)

    return round(reserved, 4)


def free_to_use(db: Session, product: Product) -> float:
    return round((product.on_hand_qty or 0) - reserved_for(db, product.id), 4)


def stock_snapshot(db: Session, product: Product) -> dict:
    res = reserved_for(db, product.id)
    return {
        "on_hand_qty": round(product.on_hand_qty or 0, 4),
        "reserved_qty": res,
        "free_to_use_qty": round((product.on_hand_qty or 0) - res, 4),
    }
