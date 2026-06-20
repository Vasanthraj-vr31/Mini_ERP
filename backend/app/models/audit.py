from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    module: Mapped[str] = mapped_column(String(40), index=True)        # Sales / Purchase / Manufacturing / Product
    record_type: Mapped[str] = mapped_column(String(60), default="")
    record_ref: Mapped[str] = mapped_column(String(40), default="")
    action: Mapped[str] = mapped_column(String(20))                    # Created / Updated / Deleted
    field_changed: Mapped[str] = mapped_column(String(80), default="")
    old_value: Mapped[str] = mapped_column(String(255), default="")
    new_value: Mapped[str] = mapped_column(String(255), default="")
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_name: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
