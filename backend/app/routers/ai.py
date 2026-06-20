from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.intelligence import AiInsight, VendorScore
from app.ai import forecasting, vendor, manufacturing_risk, health, engine

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/forecast")
def forecast(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return forecasting.forecast_all(db)


@router.get("/vendors")
def vendors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return vendor.score_vendors(db)


@router.get("/manufacturing")
def mfg(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return manufacturing_risk.detect(db)


@router.get("/health")
def health_score(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return health.compute(db)


@router.post("/regenerate")
def regenerate(db: Session = Depends(get_db), _=Depends(require_roles("Admin"))):
    return engine.regenerate(db)


@router.get("/insights")
def insights(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(AiInsight).order_by(AiInsight.id.desc()).all()
    scores = db.query(VendorScore).order_by(VendorScore.overall.desc()).all()
    return {
        "insights": [{
            "id": r.id, "category": r.category, "severity": r.severity,
            "title": r.title, "detail": r.detail, "metric": r.metric,
            "ref_type": r.ref_type, "ref_id": r.ref_id,
        } for r in rows],
        "vendor_scores": [{
            "vendor_id": s.vendor_id, "vendor_name": s.vendor_name,
            "on_time_pct": s.on_time_pct, "price_index": s.price_index,
            "fulfillment_pct": s.fulfillment_pct, "overall": s.overall,
        } for s in scores],
    }
