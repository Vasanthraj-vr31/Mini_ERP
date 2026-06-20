"""Analytics API — derived aggregates for the Analytics page.

All queries run against existing tables with no schema changes.
Requires at minimum Analytics:view permission.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import require_permission
from app.models.sales import SalesOrder, SaleOrderLine
from app.models.purchase import PurchaseOrder, PurchaseOrderLine
from app.models.manufacturing import ManufacturingOrder
from app.models.product import Product
from app.models.stock import StockLedger
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _months_back(n: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=30 * n)


@router.get("")
def analytics_summary(
    _=Depends(require_permission("Analytics", "view")),
    db: Session = Depends(get_db),
):
    # --- Sales KPIs ---
    so_all = db.query(SalesOrder).all()
    so_confirmed = [s for s in so_all if s.status not in ("Draft", "Cancelled")]
    so_delivered = [s for s in so_all if s.status == "Delivered"]
    total_revenue = sum(
        sum(l.sales_price * l.delivered_qty for l in s.lines) for s in so_delivered
    )
    pending_so = len([s for s in so_all if s.status == "Confirmed"])

    # Monthly revenue (last 6 months)
    monthly_revenue = []
    for i in range(5, -1, -1):
        start = _months_back(i + 1)
        end = _months_back(i)
        rev = 0.0
        for s in so_delivered:
            created = s.created_at
            if created and start <= created.replace(tzinfo=timezone.utc) < end.replace(tzinfo=timezone.utc):
                rev += sum(l.sales_price * l.delivered_qty for l in s.lines)
        label = end.strftime("%b %Y")
        monthly_revenue.append({"month": label, "revenue": round(rev, 2)})

    # --- Purchase KPIs ---
    po_all = db.query(PurchaseOrder).all()
    po_received = [p for p in po_all if p.status == "Received"]
    total_purchase_cost = sum(
        sum(l.cost_price * l.received_qty for l in p.lines) for p in po_received
    )
    pending_po = len([p for p in po_all if p.status == "Confirmed"])

    # Monthly purchase cost (last 6 months)
    monthly_purchase = []
    for i in range(5, -1, -1):
        start = _months_back(i + 1)
        end = _months_back(i)
        cost = 0.0
        for p in po_received:
            created = p.created_at
            if created and start <= created.replace(tzinfo=timezone.utc) < end.replace(tzinfo=timezone.utc):
                cost += sum(l.cost_price * l.received_qty for l in p.lines)
        label = end.strftime("%b %Y")
        monthly_purchase.append({"month": label, "cost": round(cost, 2)})

    # --- Manufacturing KPIs ---
    mo_all = db.query(ManufacturingOrder).all()
    mo_done = [m for m in mo_all if m.status == "Done"]
    mo_in_progress = [m for m in mo_all if m.status == "In Progress"]
    mo_planned = [m for m in mo_all if m.status == "Planned"]

    # --- Inventory KPIs ---
    products = db.query(Product).all()
    total_products = len(products)
    low_stock = [p for p in products if p.on_hand_qty < 10]
    total_inventory_value = sum(p.on_hand_qty * p.cost_price for p in products)

    # Stock movement last 30 days
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    recent_ledger = db.query(StockLedger).filter(
        StockLedger.created_at >= cutoff
    ).all()
    stock_in = sum(r.qty_delta for r in recent_ledger if r.qty_delta > 0)
    stock_out = abs(sum(r.qty_delta for r in recent_ledger if r.qty_delta < 0))

    # Top 5 products by revenue
    product_revenue: dict[int, float] = {}
    for s in so_delivered:
        for line in s.lines:
            product_revenue[line.product_id] = (
                product_revenue.get(line.product_id, 0) + line.sales_price * line.delivered_qty
            )
    product_map = {p.id: p.name for p in products}
    top_products = sorted(
        [{"product": product_map.get(pid, f"#{pid}"), "revenue": round(rev, 2)}
         for pid, rev in product_revenue.items()],
        key=lambda x: -x["revenue"],
    )[:5]

    # --- Audit activity last 30 days ---
    recent_audits = db.query(AuditLog).filter(AuditLog.created_at >= cutoff).count()

    return {
        "sales": {
            "total_orders": len(so_all),
            "confirmed_orders": len(so_confirmed),
            "delivered_orders": len(so_delivered),
            "pending_delivery": pending_so,
            "total_revenue": round(total_revenue, 2),
            "monthly_revenue": monthly_revenue,
        },
        "purchase": {
            "total_orders": len(po_all),
            "received_orders": len(po_received),
            "pending_receipt": pending_po,
            "total_cost": round(total_purchase_cost, 2),
            "monthly_cost": monthly_purchase,
        },
        "manufacturing": {
            "total_orders": len(mo_all),
            "completed": len(mo_done),
            "in_progress": len(mo_in_progress),
            "planned": len(mo_planned),
        },
        "inventory": {
            "total_products": total_products,
            "low_stock_count": len(low_stock),
            "total_value": round(total_inventory_value, 2),
            "stock_in_30d": round(stock_in, 2),
            "stock_out_30d": round(stock_out, 2),
        },
        "top_products_by_revenue": top_products,
        "recent_audit_events": recent_audits,
        "gross_margin": round(total_revenue - total_purchase_cost, 2),
    }
