from sqlalchemy import String, Float, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    sales_price: Mapped[float] = mapped_column(Float, default=0.0)
    cost_price: Mapped[float] = mapped_column(Float, default=0.0)
    on_hand_qty: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String(20), default="Units")

    # Procure on Demand config (spec: Product module)
    procure_on_demand: Mapped[bool] = mapped_column(Boolean, default=False)
    procurement_type: Mapped[str] = mapped_column(String(20), default="")  # Purchase | Manufacturing
    vendor_id: Mapped[int | None] = mapped_column(ForeignKey("vendors.id"), nullable=True)
    bom_id: Mapped[int | None] = mapped_column(ForeignKey("bills_of_material.id"), nullable=True)
