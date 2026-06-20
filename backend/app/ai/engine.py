"""InsightEngine — runs all analyzers and persists AiInsight / VendorScore rows."""
from sqlalchemy.orm import Session
from app.models.intelligence import AiInsight, VendorScore
from app.ai import forecasting, vendor, manufacturing_risk, health


def regenerate(db: Session) -> dict:
    db.query(AiInsight).delete()
    db.query(VendorScore).delete()

    # Forecast insights
    for f in forecasting.forecast_all(db):
        if f["severity"] in ("warning", "critical"):
            db.add(AiInsight(
                category="forecast", severity=f["severity"],
                title=f"{f['product']} stock risk",
                detail=(f"Runs out in ~{f['runout_days']} days "
                        f"(free-to-use {f['free_to_use_qty']}). "
                        f"Reorder {f['recommended_reorder_qty']}."),
                metric=f["runout_days"] or 0,
                ref_type="product", ref_id=f["product_id"],
            ))

    # Vendor scores
    for v in vendor.score_vendors(db):
        db.add(VendorScore(
            vendor_id=v["vendor_id"], vendor_name=v["vendor_name"],
            on_time_pct=v["on_time_pct"], price_index=v["price_index"],
            fulfillment_pct=v["fulfillment_pct"], overall=v["overall"],
        ))

    # Manufacturing risks
    risk = manufacturing_risk.detect(db)
    for r in risk["risks"]:
        db.add(AiInsight(
            category="manufacturing", severity=r["severity"],
            title=f"{r['type']} — {r['mo']}", detail=r["detail"],
        ))
    for b in risk["bottlenecks"]:
        db.add(AiInsight(
            category="manufacturing", severity="info",
            title=f"Bottleneck: {b['work_center']}",
            detail=f"{b['queued_hours']}h queued", metric=b["queued_minutes"],
        ))

    h = health.compute(db)
    db.add(AiInsight(
        category="health", severity="info",
        title=f"Business Health: {h['overall_score']} ({h['grade']})",
        detail=(f"Inventory {h['inventory_score']} · Sales {h['sales_score']} · "
                f"Procurement {h['procurement_score']} · Manufacturing {h['manufacturing_score']}"),
        metric=h["overall_score"],
    ))
    db.commit()
    return {"health": h, "manufacturing": risk}
