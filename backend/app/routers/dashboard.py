from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.sales import SalesOrder
from app.models.purchase import PurchaseOrder
from app.models.manufacturing import ManufacturingOrder
from app.models.enums import SOStatus, POStatus, MOStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _counts(db, model, statuses):
    out = {}
    for s in statuses:
        out[s.value] = db.query(func.count(model.id)).filter(model.status == s.value).scalar()
    return out


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    so = _counts(db, SalesOrder, list(SOStatus))
    po = _counts(db, PurchaseOrder, list(POStatus))
    mo = _counts(db, ManufacturingOrder, list(MOStatus))
    pending_deliveries = (so.get("Confirmed", 0) + so.get("Partially Delivered", 0))
    partial_receipts = po.get("Partially Received", 0)
    return {
        "sales": so, "purchase": po, "manufacturing": mo,
        "kpis": {
            "total_sales_orders": sum(so.values()),
            "pending_deliveries": pending_deliveries,
            "manufacturing_orders": sum(mo.values()),
            "total_purchase_orders": sum(po.values()),
            "partial_receipts": partial_receipts,
            "in_production": mo.get("In-Progress", 0) + mo.get("Confirmed", 0),
        },
    }
