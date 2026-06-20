"""AI Inventory Forecasting (deterministic, pure-Python).

Consumption velocity from the StockLedger outflows -> runout date + reorder qty.
No external ML runtime; reproducible on stage.
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.stock import StockLedger
from app.services import inventory

LOOKBACK_DAYS = 30
SERVICE_DAYS = 14  # target cover when recommending a reorder


def _avg_daily_outflow(db: Session, product_id: int) -> float:
    since = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    rows = (
        db.query(StockLedger)
        .filter(StockLedger.product_id == product_id, StockLedger.qty_delta < 0,
                StockLedger.created_at >= since)
        .all()
    )
    outflow = sum(-r.qty_delta for r in rows)
    return round(outflow / LOOKBACK_DAYS, 4) if outflow else 0.0


def forecast_product(db: Session, product: Product) -> dict:
    velocity = _avg_daily_outflow(db, product.id)
    snap = inventory.stock_snapshot(db, product)
    free = snap["free_to_use_qty"]

    if velocity <= 0:
        runout_days = None
        runout_date = None
    else:
        runout_days = round(free / velocity, 1) if free > 0 else 0
        runout_date = (datetime.now(timezone.utc) + timedelta(days=runout_days)).date().isoformat()

    reorder_qty = round(max(velocity * SERVICE_DAYS - free, 0), 2)

    if runout_days is None:
        severity = "info"
    elif runout_days <= 3:
        severity = "critical"
    elif runout_days <= 7:
        severity = "warning"
    else:
        severity = "info"

    return {
        "product_id": product.id,
        "product": product.name,
        "daily_velocity": velocity,
        **snap,
        "runout_days": runout_days,
        "runout_date": runout_date,
        "recommended_reorder_qty": reorder_qty,
        "severity": severity,
    }


def forecast_all(db: Session) -> list[dict]:
    out = [forecast_product(db, p) for p in db.query(Product).all()]
    # most urgent first
    out.sort(key=lambda x: (x["runout_days"] is None, x["runout_days"] if x["runout_days"] is not None else 9e9))
    return out
