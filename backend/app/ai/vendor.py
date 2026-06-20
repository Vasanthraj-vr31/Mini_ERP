"""AI Vendor Recommendation — score vendors on delivery + price + fulfillment."""
from sqlalchemy.orm import Session
from app.models.partners import Vendor
from app.models.purchase import PurchaseOrder, PurchaseOrderLine
from app.models.product import Product
from app.models.enums import POStatus


def score_vendors(db: Session) -> list[dict]:
    vendors = db.query(Vendor).all()
    # market average cost per product for a price index
    results = []
    for v in vendors:
        pos = db.query(PurchaseOrder).filter(PurchaseOrder.vendor_id == v.id).all()
        total = len(pos)
        received = sum(1 for p in pos if p.status == POStatus.fully_received.value)
        partial = sum(1 for p in pos if p.status == POStatus.partially_received.value)

        # on-time proxy: shorter promised lead time scores higher
        on_time = max(0.0, 100.0 - v.lead_time_days * 4)
        fulfillment = round((received + 0.5 * partial) / total * 100, 1) if total else 60.0

        # price index: vendor avg cost vs market avg (lower = cheaper = better)
        lines = (
            db.query(PurchaseOrderLine)
            .join(PurchaseOrder, PurchaseOrderLine.order_id == PurchaseOrder.id)
            .filter(PurchaseOrder.vendor_id == v.id)
            .all()
        )
        if lines:
            vendor_avg = sum(l.cost_price for l in lines) / len(lines)
            market_avg = (db.query(Product).with_entities(Product.cost_price).all())
            market = [c[0] for c in market_avg if c[0]]
            mkt_avg = sum(market) / len(market) if market else vendor_avg or 1
            price_index = round((vendor_avg / mkt_avg) * 100, 1) if mkt_avg else 100.0
        else:
            price_index = 100.0

        price_score = max(0.0, 100.0 - (price_index - 100.0))  # cheaper than market -> >100 capped
        overall = round(0.4 * on_time + 0.35 * fulfillment + 0.25 * price_score, 1)

        results.append({
            "vendor_id": v.id, "vendor_name": v.name,
            "lead_time_days": v.lead_time_days,
            "on_time_pct": round(on_time, 1),
            "fulfillment_pct": fulfillment,
            "price_index": price_index,
            "orders": total,
            "overall": overall,
        })

    results.sort(key=lambda x: x["overall"], reverse=True)
    return results
