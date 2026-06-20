from sqlalchemy import func
from sqlalchemy.orm import Session


def next_ref(db: Session, model, prefix: str) -> str:
    """Generate SO-000001 style references per model."""
    count = db.query(func.count(model.id)).scalar() or 0
    return f"{prefix}-{count + 1:06d}"
