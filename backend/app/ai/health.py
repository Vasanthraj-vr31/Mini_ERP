"""AI Business Health Score — composite 0-100 across 4 ERP pillars."""
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.sales import SalesOrder
from app.models.purchase import PurchaseOrder
from app.models.manufacturing import ManufacturingOrder
from app.models.enums import SOStatus, POStatus, MOStatus
from app.ai import forecasting, manufacturing_risk


def _clamp(v): return max(0.0, min(100.0, round(v, 1)))


def compute(db: Session) -> dict:
    # Inventory score: % of products NOT at critical/warning runout
    fc = forecasting.forecast_all(db)
    total_p = len(fc) or 1
    healthy = sum(1 for f in fc if f["severity"] == "info")
    inventory_score = _clamp(healthy / total_p * 100)

    # Sales score: fulfillment ratio
    sos = db.query(SalesOrder).all()
    if sos:
        good = sum(1 for s in sos if s.status in (SOStatus.fully_delivered.value,
                                                  SOStatus.partially_delivered.value))
        cancelled = sum(1 for s in sos if s.status == SOStatus.cancelled.value)
        sales_score = _clamp((good - cancelled) / len(sos) * 100 + 30)
    else:
        sales_score = 70.0

    # Procurement score: received vs open
    pos = db.query(PurchaseOrder).all()
    if pos:
        received = sum(1 for p in pos if p.status == POStatus.fully_received.value)
        procurement_score = _clamp(received / len(pos) * 100 + 25)
    else:
        procurement_score = 70.0

    # Manufacturing score: penalise by open risks
    risk = manufacturing_risk.detect(db)
    manufacturing_score = _clamp(100 - risk["risk_count"] * 12)

    overall = _clamp(0.3 * inventory_score + 0.25 * sales_score +
                     0.2 * procurement_score + 0.25 * manufacturing_score)

    grade = ("A" if overall >= 85 else "B" if overall >= 70 else
             "C" if overall >= 55 else "D")

    return {
        "inventory_score": inventory_score,
        "sales_score": sales_score,
        "procurement_score": procurement_score,
        "manufacturing_score": manufacturing_score,
        "overall_score": overall,
        "grade": grade,
    }
