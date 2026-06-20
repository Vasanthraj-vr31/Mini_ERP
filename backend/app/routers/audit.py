from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_roles
from app.models.audit import AuditLog

router = APIRouter(prefix="/api/audit-logs", tags=["audit"])


@router.get("")
def list_logs(db: Session = Depends(get_db), module: str | None = None,
              _=Depends(require_roles("Admin", "System Administrator", "Sales Administrator", "Business Owner")),
              action: str | None = None, user: str | None = None, limit: int = 200):
    q = db.query(AuditLog)
    if module and module != "All Modules": q = q.filter(AuditLog.module == module)
    if action and action != "All Actions": q = q.filter(AuditLog.action == action)
    if user and user != "All Users": q = q.filter(AuditLog.user_name == user)
    rows = q.order_by(AuditLog.id.desc()).limit(limit).all()
    return {
        "summary": {
            "total": db.query(func.count(AuditLog.id)).scalar(),
            "created": db.query(func.count(AuditLog.id)).filter(AuditLog.action == "Created").scalar(),
            "updated": db.query(func.count(AuditLog.id)).filter(AuditLog.action == "Updated").scalar(),
            "deleted": db.query(func.count(AuditLog.id)).filter(AuditLog.action == "Deleted").scalar(),
        },
        "logs": [{
            "id": r.id, "created_at": r.created_at.isoformat(), "user": r.user_name,
            "module": r.module, "record_type": r.record_type, "record_ref": r.record_ref,
            "action": r.action, "field_changed": r.field_changed,
            "old_value": r.old_value, "new_value": r.new_value,
        } for r in rows],
    }
