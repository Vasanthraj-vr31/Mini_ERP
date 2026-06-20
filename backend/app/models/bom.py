from sqlalchemy import String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class WorkCenter(Base):
    __tablename__ = "work_centers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    capacity_per_hour: Mapped[float] = mapped_column(Float, default=1.0)


class BillOfMaterial(Base):
    __tablename__ = "bills_of_material"
    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    finished_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[float] = mapped_column(Float, default=1.0)  # output qty this BoM yields

    finished_product = relationship("Product", foreign_keys=[finished_product_id])
    components: Mapped[list["BomComponent"]] = relationship(
        back_populates="bom", cascade="all, delete-orphan"
    )
    operations: Mapped[list["BomOperation"]] = relationship(
        back_populates="bom", cascade="all, delete-orphan"
    )


class BomComponent(Base):
    __tablename__ = "bom_components"
    id: Mapped[int] = mapped_column(primary_key=True)
    bom_id: Mapped[int] = mapped_column(ForeignKey("bills_of_material.id"))
    component_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[float] = mapped_column(Float, default=1.0)  # per 1 finished unit

    bom: Mapped["BillOfMaterial"] = relationship(back_populates="components")
    component = relationship("Product", foreign_keys=[component_id])


class BomOperation(Base):
    __tablename__ = "bom_operations"
    id: Mapped[int] = mapped_column(primary_key=True)
    bom_id: Mapped[int] = mapped_column(ForeignKey("bills_of_material.id"))
    name: Mapped[str] = mapped_column(String(120))
    work_center_id: Mapped[int | None] = mapped_column(ForeignKey("work_centers.id"), nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)  # per 1 finished unit

    bom: Mapped["BillOfMaterial"] = relationship(back_populates="operations")
    work_center = relationship("WorkCenter")
