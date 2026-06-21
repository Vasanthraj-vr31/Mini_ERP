from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .enums import SOStatus


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    customer_address: Mapped[str] = mapped_column(Text, default="")
    salesperson_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=SOStatus.pending.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    lines: Mapped[list["SaleOrderLine"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    customer = relationship("Customer")
    salesperson = relationship("User")

    @property
    def total(self) -> float:
        return round(sum(l.total for l in self.lines), 2)


class SaleOrderLine(Base):
    __tablename__ = "sale_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("sales_orders.id"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    ordered_qty: Mapped[float] = mapped_column(Float, default=0.0)
    delivered_qty: Mapped[float] = mapped_column(Float, default=0.0)
    sales_price: Mapped[float] = mapped_column(Float, default=0.0)
    
    shortage_qty: Mapped[float] = mapped_column(Float, default=0.0)
    linked_po: Mapped[str | None] = mapped_column(String(50), nullable=True)
    linked_mo: Mapped[str | None] = mapped_column(String(50), nullable=True)

    order: Mapped["SalesOrder"] = relationship(back_populates="lines")
    product = relationship("Product")

    @property
    def total(self) -> float:
        qty = self.delivered_qty if self.delivered_qty else self.ordered_qty
        return round(qty * self.sales_price, 2)

