from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from .enums import MOStatus


class ManufacturingOrder(Base):
    __tablename__ = "manufacturing_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    finished_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    bom_id: Mapped[int | None] = mapped_column(ForeignKey("bills_of_material.id"), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=MOStatus.draft.value)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    schedule_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="")

    finished_product = relationship("Product", foreign_keys=[finished_product_id])
    bom = relationship("BillOfMaterial")
    assignee = relationship("User")
    components: Mapped[list["MoComponent"]] = relationship(
        back_populates="mo", cascade="all, delete-orphan"
    )
    work_orders: Mapped[list["MoWorkOrder"]] = relationship(
        back_populates="mo", cascade="all, delete-orphan"
    )


class MoComponent(Base):
    __tablename__ = "mo_components"
    id: Mapped[int] = mapped_column(primary_key=True)
    mo_id: Mapped[int] = mapped_column(ForeignKey("manufacturing_orders.id"))
    component_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    to_consume_qty: Mapped[float] = mapped_column(Float, default=0.0)
    consumed_qty: Mapped[float] = mapped_column(Float, default=0.0)

    mo: Mapped["ManufacturingOrder"] = relationship(back_populates="components")
    component = relationship("Product")


class MoWorkOrder(Base):
    __tablename__ = "mo_work_orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    mo_id: Mapped[int] = mapped_column(ForeignKey("manufacturing_orders.id"))
    operation: Mapped[str] = mapped_column(String(120))
    work_center_id: Mapped[int | None] = mapped_column(ForeignKey("work_centers.id"), nullable=True)
    expected_duration: Mapped[int] = mapped_column(Integer, default=0)  # minutes, scaled by MO qty
    real_duration: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="Pending")

    mo: Mapped["ManufacturingOrder"] = relationship(back_populates="work_orders")
    work_center = relationship("WorkCenter")
