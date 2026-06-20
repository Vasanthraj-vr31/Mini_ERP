from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.purchase import PurchaseOrder, PurchaseOrderLine
from app.models.product import Product
from app.models.enums import POStatus
from app.schemas import PurchaseOrderIn, ReceiveIn
from app.serializers import po_dict
from app.services import sequence, audit
from app.services import purchase as po_svc

router = APIRouter(prefix="/api/purchase-orders", tags=["purchase"])


@router.get("")
def list_pos(db: Session = Depends(get_db)):
    return [po_dict(db, p) for p in db.query(PurchaseOrder).order_by(PurchaseOrder.id.desc()).all()]


@router.get("/{pid}")
def get_po(pid: int, db: Session = Depends(get_db)):
    p = db.get(PurchaseOrder, pid)
    if not p: raise HTTPException(404, "Purchase Order not found")
    return po_dict(db, p)


@router.post("")
def create_po(body: PurchaseOrderIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    po = PurchaseOrder(reference=sequence.next_ref(db, PurchaseOrder, "PO"),
                       vendor_id=body.vendor_id, vendor_address=body.vendor_address,
                       responsible_id=body.responsible_id, status=POStatus.draft.value)
    for ln in body.lines:
        p = db.get(Product, ln.product_id)
        cost = ln.cost_price if ln.cost_price is not None else (p.cost_price if p else 0)
        po.lines.append(PurchaseOrderLine(product_id=ln.product_id, ordered_qty=ln.ordered_qty,
                                          cost_price=cost))
    db.add(po); db.flush()
    audit.log(db, module="Purchase", record_type="Purchase Order", record_ref=po.reference,
              action="Created", new=f"Vendor {po.vendor_id}", user=user)
    db.commit(); db.refresh(po)
    return po_dict(db, po)


@router.put("/{pid}")
def update_po(pid: int, body: PurchaseOrderIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    po = db.get(PurchaseOrder, pid)
    if not po: raise HTTPException(404, "Purchase Order not found")
    if po.status != POStatus.draft.value:
        raise HTTPException(400, "Only Draft orders are editable")
    po.vendor_id = body.vendor_id
    po.vendor_address = body.vendor_address
    po.responsible_id = body.responsible_id
    po.lines.clear()
    for ln in body.lines:
        p = db.get(Product, ln.product_id)
        cost = ln.cost_price if ln.cost_price is not None else (p.cost_price if p else 0)
        po.lines.append(PurchaseOrderLine(product_id=ln.product_id, ordered_qty=ln.ordered_qty,
                                          cost_price=cost))
    db.commit(); db.refresh(po)
    return po_dict(db, po)


@router.post("/{pid}/confirm")
def confirm_po(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    po = db.get(PurchaseOrder, pid)
    if not po: raise HTTPException(404, "Purchase Order not found")
    po_svc.confirm(db, po, user=user); db.commit(); db.refresh(po)
    return po_dict(db, po)


@router.post("/{pid}/receive")
def receive_po(pid: int, body: ReceiveIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    po = db.get(PurchaseOrder, pid)
    if not po: raise HTTPException(404, "Purchase Order not found")
    po_svc.receive(db, po, receipts=body.receipts or None, user=user); db.commit(); db.refresh(po)
    return po_dict(db, po)


@router.post("/{pid}/cancel")
def cancel_po(pid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    po = db.get(PurchaseOrder, pid)
    if not po: raise HTTPException(404, "Purchase Order not found")
    po_svc.cancel(db, po, user=user); db.commit(); db.refresh(po)
    return po_dict(db, po)
