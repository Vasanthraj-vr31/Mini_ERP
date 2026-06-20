from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.manufacturing import ManufacturingOrder, MoComponent, MoWorkOrder
from app.models.product import Product
from app.schemas import ManufacturingOrderIn
from app.serializers import mo_dict
from app.services import audit
from app.services import manufacturing as mo_svc

router = APIRouter(prefix="/api/manufacturing-orders", tags=["manufacturing"])


@router.get("")
def list_mos(db: Session = Depends(get_db), _=Depends(require_permission("Manufacturing", "view"))):
    return [mo_dict(db, m) for m in db.query(ManufacturingOrder).order_by(ManufacturingOrder.id.desc()).all()]


@router.get("/{mid}")
def get_mo(mid: int, db: Session = Depends(get_db), _=Depends(require_permission("Manufacturing", "view"))):
    m = db.get(ManufacturingOrder, mid)
    if not m: raise HTTPException(404, "Manufacturing Order not found")
    return mo_dict(db, m)


@router.post("")
def create_mo(body: ManufacturingOrderIn, db: Session = Depends(get_db),
              user=Depends(require_permission("Manufacturing", "create"))):
    product = db.get(Product, body.finished_product_id)
    if not product: raise HTTPException(400, "Finished product not found")
    mo = mo_svc.build_mo_from_bom(db, finished_product=product, bom_id=body.bom_id,
                                  quantity=body.quantity, assignee_id=body.assignee_id)
    # allow manual override of components / work orders when no BoM (spec)
    if body.components is not None:
        mo.components.clear()
        for c in body.components:
            mo.components.append(MoComponent(component_id=c.component_id,
                                             to_consume_qty=c.to_consume_qty,
                                             consumed_qty=c.consumed_qty))
    if body.work_orders is not None:
        mo.work_orders.clear()
        for w in body.work_orders:
            mo.work_orders.append(MoWorkOrder(operation=w.operation, work_center_id=w.work_center_id,
                                              expected_duration=w.expected_duration,
                                              real_duration=w.real_duration))
    db.add(mo); db.flush()
    audit.log(db, module="Manufacturing", record_type="Manufacturing Order",
              record_ref=mo.reference, action="Created", new=product.name, user=user)
    db.commit(); db.refresh(mo)
    return mo_dict(db, mo)


@router.put("/{mid}")
def update_mo(mid: int, body: ManufacturingOrderIn, db: Session = Depends(get_db),
              user=Depends(require_permission("Manufacturing", "edit"))):
    mo = db.get(ManufacturingOrder, mid)
    if not mo: raise HTTPException(404, "Manufacturing Order not found")
    if mo.status in ("Done", "Cancelled"):
        raise HTTPException(400, "Cannot edit a Done/Cancelled MO")
    mo.quantity = body.quantity
    mo.assignee_id = body.assignee_id
    if body.components is not None:
        mo.components.clear()
        for c in body.components:
            mo.components.append(MoComponent(component_id=c.component_id,
                                             to_consume_qty=c.to_consume_qty,
                                             consumed_qty=c.consumed_qty))
    if body.work_orders is not None:
        mo.work_orders.clear()
        for w in body.work_orders:
            mo.work_orders.append(MoWorkOrder(operation=w.operation, work_center_id=w.work_center_id,
                                              expected_duration=w.expected_duration,
                                              real_duration=w.real_duration))
    db.commit(); db.refresh(mo)
    return mo_dict(db, mo)


@router.post("/{mid}/confirm")
def confirm_mo(mid: int, db: Session = Depends(get_db),
               user=Depends(require_permission("Manufacturing", "approve"))):
    mo = db.get(ManufacturingOrder, mid)
    if not mo: raise HTTPException(404, "MO not found")
    mo_svc.confirm(db, mo, user=user); db.commit(); db.refresh(mo)
    return mo_dict(db, mo)


@router.post("/{mid}/start")
def start_mo(mid: int, db: Session = Depends(get_db),
             user=Depends(require_permission("Manufacturing", "approve"))):
    mo = db.get(ManufacturingOrder, mid)
    if not mo: raise HTTPException(404, "MO not found")
    mo_svc.start(db, mo, user=user); db.commit(); db.refresh(mo)
    return mo_dict(db, mo)


@router.post("/{mid}/produce")
def produce_mo(mid: int, db: Session = Depends(get_db),
               user=Depends(require_permission("Manufacturing", "approve"))):
    mo = db.get(ManufacturingOrder, mid)
    if not mo: raise HTTPException(404, "MO not found")
    mo_svc.produce(db, mo, user=user); db.commit(); db.refresh(mo)
    return mo_dict(db, mo)


@router.post("/{mid}/cancel")
def cancel_mo(mid: int, db: Session = Depends(get_db),
              user=Depends(require_permission("Manufacturing", "approve"))):
    mo = db.get(ManufacturingOrder, mid)
    if not mo: raise HTTPException(404, "MO not found")
    mo_svc.cancel(db, mo, user=user); db.commit(); db.refresh(mo)
    return mo_dict(db, mo)
