from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log(db: Session, *, module: str, record_type: str, record_ref: str, action: str,
        field: str = "", old=None, new=None, user=None):
    """Write one audit row. Every spec field marked '(track logs)' routes through here."""
    entry = AuditLog(
        module=module,
        record_type=record_type,
        record_ref=record_ref,
        action=action,
        field_changed=field,
        old_value="" if old is None else str(old),
        new_value="" if new is None else str(new),
        user_id=getattr(user, "id", None),
        user_name=getattr(user, "name", "system"),
    )
    db.add(entry)
    return entry
