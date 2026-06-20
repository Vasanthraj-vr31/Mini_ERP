from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.bom import BillOfMaterial, BomComponent, BomOperation
from app.schemas import BomIn
from app.serializers import bom_dict
from app.services import sequence, audit

router = APIRouter(prefix="/api/boms", tags=["boms"])


@router.get("")
def list_boms(db: Session = Depends(get_db), product_id: int | None = None):
    q = db.query(BillOfMaterial)
    if product_id:
        q = q.filter(BillOfMaterial.finished_product_id == product_id)
    return [bom_dict(db, b) for b in q.order_by(BillOfMaterial.id).all()]


@router.get("/{bid}")
def get_bom(bid: int, db: Session = Depends(get_db)):
    b = db.get(BillOfMaterial, bid)
    if not b: raise HTTPException(404, "BoM not found")
    return bom_dict(db, b)


@router.post("")
def create_bom(body: BomIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = BillOfMaterial(reference=sequence.next_ref(db, BillOfMaterial, "BOM"),
                       finished_product_id=body.finished_product_id, quantity=body.quantity)
    for c in body.components:
        b.components.append(BomComponent(component_id=c.component_id, quantity=c.quantity))
    for o in body.operations:
        b.operations.append(BomOperation(name=o.name, work_center_id=o.work_center_id,
                                         duration_minutes=o.duration_minutes))
    db.add(b); db.flush()
    audit.log(db, module="Manufacturing", record_type="BoM", record_ref=b.reference,
              action="Created", new=f"BoM for product {b.finished_product_id}", user=user)
    db.commit(); db.refresh(b)
    return bom_dict(db, b)


@router.put("/{bid}")
def update_bom(bid: int, body: BomIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = db.get(BillOfMaterial, bid)
    if not b: raise HTTPException(404, "BoM not found")
    b.finished_product_id = body.finished_product_id
    b.quantity = body.quantity
    b.components.clear(); b.operations.clear()
    for c in body.components:
        b.components.append(BomComponent(component_id=c.component_id, quantity=c.quantity))
    for o in body.operations:
        b.operations.append(BomOperation(name=o.name, work_center_id=o.work_center_id,
                                         duration_minutes=o.duration_minutes))
    audit.log(db, module="Manufacturing", record_type="BoM", record_ref=b.reference,
              action="Updated", user=user)
    db.commit(); db.refresh(b)
    return bom_dict(db, b)
