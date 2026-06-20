from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.partners import Customer, Vendor
from app.models.user import User
from app.models.bom import WorkCenter
from app.schemas import CustomerIn, VendorIn, WorkCenterIn

router = APIRouter(prefix="/api", tags=["masters"])


@router.get("/customers")
def customers(db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "address": c.address} for c in db.query(Customer).all()]


@router.post("/customers")
def add_customer(body: CustomerIn, db: Session = Depends(get_db)):
    c = Customer(**body.model_dump()); db.add(c); db.commit(); db.refresh(c)
    return {"id": c.id, "name": c.name, "address": c.address}


@router.get("/vendors")
def vendors(db: Session = Depends(get_db)):
    return [{"id": v.id, "name": v.name, "address": v.address,
             "lead_time_days": v.lead_time_days} for v in db.query(Vendor).all()]


@router.post("/vendors")
def add_vendor(body: VendorIn, db: Session = Depends(get_db)):
    v = Vendor(**body.model_dump()); db.add(v); db.commit(); db.refresh(v)
    return {"id": v.id, "name": v.name, "address": v.address, "lead_time_days": v.lead_time_days}


@router.get("/users")
def users(db: Session = Depends(get_db)):
    return [{"id": u.id, "name": u.name, "role": u.role, "position": u.position}
            for u in db.query(User).all()]


@router.get("/work-centers")
def work_centers(db: Session = Depends(get_db)):
    return [{"id": w.id, "name": w.name, "capacity_per_hour": w.capacity_per_hour}
            for w in db.query(WorkCenter).all()]


@router.post("/work-centers")
def add_work_center(body: WorkCenterIn, db: Session = Depends(get_db)):
    w = WorkCenter(**body.model_dump()); db.add(w); db.commit(); db.refresh(w)
    return {"id": w.id, "name": w.name, "capacity_per_hour": w.capacity_per_hour}
