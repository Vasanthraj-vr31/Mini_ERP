from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.core.security import get_current_user
from app.models.sales import SalesOrder, SaleOrderLine
from app.models.product import Product
from app.models.partners import Customer
from app.models.enums import SOStatus
from app.schemas import SalesOrderIn, DeliverIn, PlaceOrderIn
from app.serializers import so_dict
from app.services import sequence, audit
from app.services import sales as sales_svc

router = APIRouter(prefix="/api/sales-orders", tags=["sales"])


@router.get("")
def list_sos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Customers can only see their own orders. Admins see all.
    query = db.query(SalesOrder).order_by(SalesOrder.id.desc())
    if user.role == "Normal User":
        customer = db.query(Customer).filter(Customer.name == user.name).first()
        if not customer:
            return []
        query = query.filter(SalesOrder.customer_id == customer.id)
    return [so_dict(db, s) for s in query.all()]


@router.get("/{sid}")
def get_so(sid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    s = db.get(SalesOrder, sid)
    if not s: raise HTTPException(404, "Sales Order not found")
    if user.role == "Normal User":
        customer = db.query(Customer).filter(Customer.name == user.name).first()
        if not customer or s.customer_id != customer.id:
            raise HTTPException(403, "Forbidden")
    return so_dict(db, s)


@router.post("/place-order")
def place_order(body: PlaceOrderIn, db: Session = Depends(get_db),
                user=Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.name == user.name).first()
    if not customer:
        customer = Customer(name=user.name)
        db.add(customer); db.flush()

    so = SalesOrder(reference=sequence.next_ref(db, SalesOrder, "SO"),
                    customer_id=customer.id, customer_address=customer.address,
                    salesperson_id=None, status=SOStatus.pending.value)
    for ln in body.lines:
        p = db.get(Product, ln.product_id)
        price = ln.sales_price if ln.sales_price is not None else (p.sales_price if p else 0)
        so.lines.append(SaleOrderLine(product_id=ln.product_id, ordered_qty=ln.ordered_qty,
                                      sales_price=price))
    db.add(so); db.flush()
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Placed", new=f"Customer {so.customer_id}", user=user)
    
    result = sales_svc.process_customer_order(db, so, user=user)
    db.commit(); db.refresh(so)
    return {"order": so_dict(db, so), **result}


@router.post("")
def create_so(body: SalesOrderIn, db: Session = Depends(get_db),
              user=Depends(require_permission("Sales", "create"))):
    so = SalesOrder(reference=sequence.next_ref(db, SalesOrder, "SO"),
                    customer_id=body.customer_id, customer_address=body.customer_address,
                    salesperson_id=body.salesperson_id, status=SOStatus.pending.value)
    for ln in body.lines:
        p = db.get(Product, ln.product_id)
        price = ln.sales_price if ln.sales_price is not None else (p.sales_price if p else 0)
        so.lines.append(SaleOrderLine(product_id=ln.product_id, ordered_qty=ln.ordered_qty,
                                      sales_price=price))
    db.add(so); db.flush()
    audit.log(db, module="Sales", record_type="Sales Order", record_ref=so.reference,
              action="Created", new=f"Customer {so.customer_id}", user=user)
    db.commit(); db.refresh(so)
    return so_dict(db, so)


@router.put("/{sid}")
def update_so(sid: int, body: SalesOrderIn, db: Session = Depends(get_db),
              user=Depends(require_permission("Sales", "edit"))):
    so = db.get(SalesOrder, sid)
    if not so: raise HTTPException(404, "Sales Order not found")
    if so.status != SOStatus.pending.value:
        raise HTTPException(400, "Only Pending orders are editable")
    so.customer_id = body.customer_id
    so.customer_address = body.customer_address
    so.salesperson_id = body.salesperson_id
    so.lines.clear()
    for ln in body.lines:
        p = db.get(Product, ln.product_id)
        price = ln.sales_price if ln.sales_price is not None else (p.sales_price if p else 0)
        so.lines.append(SaleOrderLine(product_id=ln.product_id, ordered_qty=ln.ordered_qty,
                                      sales_price=price))
    db.commit(); db.refresh(so)
    return so_dict(db, so)


@router.post("/{sid}/confirm")
def confirm_so(sid: int, db: Session = Depends(get_db),
               user=Depends(require_permission("Sales", "approve"))):
    so = db.get(SalesOrder, sid)
    if not so: raise HTTPException(404, "Sales Order not found")
    result = sales_svc.process_customer_order(db, so, user=user)
    db.commit(); db.refresh(so)
    return {"order": so_dict(db, so), **result}


@router.post("/{sid}/deliver")
def deliver_so(sid: int, body: DeliverIn, db: Session = Depends(get_db),
               user=Depends(require_permission("Sales", "approve"))):
    so = db.get(SalesOrder, sid)
    if not so: raise HTTPException(404, "Sales Order not found")
    sales_svc.deliver(db, so, deliveries=body.deliveries or None, user=user)
    db.commit(); db.refresh(so)
    return so_dict(db, so)


@router.post("/{sid}/cancel")
def cancel_so(sid: int, db: Session = Depends(get_db),
              user=Depends(require_permission("Sales", "approve"))):
    so = db.get(SalesOrder, sid)
    if not so: raise HTTPException(404, "Sales Order not found")
    sales_svc.cancel(db, so, user=user)
    db.commit(); db.refresh(so)
    return so_dict(db, so)
