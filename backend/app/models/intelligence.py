from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AiInsight(Base):
    """Structured AI output surfaced on the dashboard."""
    __tablename__ = "ai_insights"
    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(40), index=True)  # forecast / vendor / manufacturing / health
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info / warning / critical
    title: Mapped[str] = mapped_column(String(160))
    detail: Mapped[str] = mapped_column(String(500), default="")
    metric: Mapped[float] = mapped_column(Float, default=0.0)
    ref_type: Mapped[str] = mapped_column(String(40), default="")
    ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class VendorScore(Base):
    __tablename__ = "vendor_scores"
    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_id: Mapped[int] = mapped_column(Integer, index=True)
    vendor_name: Mapped[str] = mapped_column(String(160))
    on_time_pct: Mapped[float] = mapped_column(Float, default=0.0)
    price_index: Mapped[float] = mapped_column(Float, default=0.0)  # lower is cheaper
    fulfillment_pct: Mapped[float] = mapped_column(Float, default=0.0)
    overall: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
