from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.product import Product
from app.schemas import ProductIn
from app.serializers import product_dict
from app.services import sequence, audit

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("")
def list_products(db: Session = Depends(get_db)):
    return [product_dict(db, p) for p in db.query(Product).order_by(Product.id).all()]


@router.get("/{pid}")
def get_product(pid: int, db: Session = Depends(get_db)):
    p = db.get(Product, pid)
    if not p: raise HTTPException(404, "Product not found")
    return product_dict(db, p)


@router.post("")
def create_product(body: ProductIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if body.procure_on_demand:
        if body.procurement_type not in ("Purchase", "Manufacturing"):
            raise HTTPException(400, "Procurement Type required when Procure on Demand is on")
        if body.procurement_type == "Purchase" and not body.vendor_id:
            raise HTTPException(400, "Vendor required for Purchase procurement")
        if body.procurement_type == "Manufacturing" and not body.bom_id:
            raise HTTPException(400, "BoM required for Manufacturing procurement")
    p = Product(reference=sequence.next_ref(db, Product, "PROD"), **body.model_dump())
    db.add(p); db.flush()
    audit.log(db, module="Product", record_type="Product", record_ref=p.reference,
              action="Created", new=p.name, user=user)
    db.commit(); db.refresh(p)
    return product_dict(db, p)


@router.put("/{pid}")
def update_product(pid: int, body: ProductIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.get(Product, pid)
    if not p: raise HTTPException(404, "Product not found")
    tracked = ["name", "sales_price", "cost_price", "on_hand_qty", "procure_on_demand",
               "procurement_type", "vendor_id", "bom_id"]
    data = body.model_dump()
    for f in tracked:
        old = getattr(p, f)
        new = data[f]
        if old != new:
            audit.log(db, module="Product", record_type="Product", record_ref=p.reference,
                      action="Updated", field=f, old=old, new=new, user=user)
            setattr(p, f, new)
    p.unit = data["unit"]
    db.commit(); db.refresh(p)
    return product_dict(db, p)


@router.get("/{pid}/ledger")
def product_ledger(pid: int, db: Session = Depends(get_db)):
    from app.models.stock import StockLedger
    rows = (db.query(StockLedger).filter(StockLedger.product_id == pid)
            .order_by(StockLedger.id.desc()).all())
    return [{"id": r.id, "qty_delta": r.qty_delta, "balance_after": r.balance_after,
             "source_type": r.source_type, "source_ref": r.source_ref, "note": r.note,
             "created_at": r.created_at.isoformat()} for r in rows]
