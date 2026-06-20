from sqlalchemy.orm import Session
from app.services import inventory


def product_dict(db: Session, p) -> dict:
    snap = inventory.stock_snapshot(db, p)
    return {
        "id": p.id, "reference": p.reference, "name": p.name,
        "sales_price": p.sales_price, "cost_price": p.cost_price, "unit": p.unit,
        "procure_on_demand": p.procure_on_demand, "procurement_type": p.procurement_type,
        "vendor_id": p.vendor_id, "bom_id": p.bom_id,
        "photo": getattr(p, "photo", None),
        **snap,
    }


def so_dict(db: Session, so) -> dict:
    return {
        "id": so.id, "reference": so.reference, "status": so.status,
        "customer_id": so.customer_id,
        "customer": so.customer.name if so.customer else None,
        "customer_address": so.customer_address,
        "salesperson_id": so.salesperson_id,
        "salesperson": so.salesperson.name if so.salesperson else None,
        "created_at": so.created_at.isoformat() if so.created_at else None,
        "total": so.total,
        "lines": [{
            "id": l.id, "product_id": l.product_id,
            "product": l.product.name if l.product else None,
            "ordered_qty": l.ordered_qty, "delivered_qty": l.delivered_qty,
            "sales_price": l.sales_price, "total": l.total,
            "free_to_use": inventory.free_to_use(db, l.product) if l.product else 0,
            "available": (inventory.free_to_use(db, l.product) >= l.ordered_qty) if l.product else True,
        } for l in so.lines],
    }


def po_dict(db: Session, po) -> dict:
    return {
        "id": po.id, "reference": po.reference, "status": po.status,
        "vendor_id": po.vendor_id, "vendor": po.vendor.name if po.vendor else None,
        "vendor_address": po.vendor_address,
        "responsible_id": po.responsible_id,
        "responsible": po.responsible.name if po.responsible else None,
        "created_at": po.created_at.isoformat() if po.created_at else None,
        "source": po.source, "total": po.total,
        "lines": [{
            "id": l.id, "product_id": l.product_id,
            "product": l.product.name if l.product else None,
            "ordered_qty": l.ordered_qty, "received_qty": l.received_qty,
            "cost_price": l.cost_price, "total": l.total,
        } for l in po.lines],
    }


def mo_dict(db: Session, mo) -> dict:
    return {
        "id": mo.id, "reference": mo.reference, "status": mo.status,
        "finished_product_id": mo.finished_product_id,
        "finished_product": mo.finished_product.name if mo.finished_product else None,
        "bom_id": mo.bom_id, "quantity": mo.quantity,
        "assignee_id": mo.assignee_id, "assignee": mo.assignee.name if mo.assignee else None,
        "created_at": mo.created_at.isoformat() if mo.created_at else None,
        "source": mo.source,
        "components": [{
            "id": c.id, "component_id": c.component_id,
            "component": c.component.name if c.component else None,
            "to_consume_qty": c.to_consume_qty, "consumed_qty": c.consumed_qty,
            "availability": "Available" if (c.component and inventory.free_to_use(db, c.component) >= c.to_consume_qty) else "Not Available",
        } for c in mo.components],
        "work_orders": [{
            "id": w.id, "operation": w.operation,
            "work_center_id": w.work_center_id,
            "work_center": w.work_center.name if w.work_center else None,
            "expected_duration": w.expected_duration, "real_duration": w.real_duration,
            "status": w.status,
        } for w in mo.work_orders],
    }


def bom_dict(db: Session, b) -> dict:
    return {
        "id": b.id, "reference": b.reference,
        "finished_product_id": b.finished_product_id,
        "finished_product": b.finished_product.name if b.finished_product else None,
        "quantity": b.quantity,
        "components": [{
            "id": c.id, "component_id": c.component_id,
            "component": c.component.name if c.component else None,
            "quantity": c.quantity,
        } for c in b.components],
        "operations": [{
            "id": o.id, "name": o.name, "work_center_id": o.work_center_id,
            "work_center": o.work_center.name if o.work_center else None,
            "duration_minutes": o.duration_minutes,
        } for o in b.operations],
    }
