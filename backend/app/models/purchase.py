from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .enums import POStatus


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendors.id"))
    vendor_address: Mapped[str] = mapped_column(Text, default="")
    responsible_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=POStatus.draft.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    # link back to the SO that auto-triggered this PO (idempotency / traceability)
    source: Mapped[str] = mapped_column(String(40), default="")

    lines: Mapped[list["PurchaseOrderLine"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    vendor = relationship("Vendor")
    responsible = relationship("User")

    @property
    def total(self) -> float:
        return round(sum(l.total for l in self.lines), 2)


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    ordered_qty: Mapped[float] = mapped_column(Float, default=0.0)
    received_qty: Mapped[float] = mapped_column(Float, default=0.0)
    cost_price: Mapped[float] = mapped_column(Float, default=0.0)

    order: Mapped["PurchaseOrder"] = relationship(back_populates="lines")
    product = relationship("Product")

    @property
    def total(self) -> float:
        qty = self.received_qty if self.received_qty else self.ordered_qty
        return round(qty * self.cost_price, 2)
