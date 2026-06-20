from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    login_id: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(40), default="Sales")
    position: Mapped[str] = mapped_column(String(120), default="")
    address: Mapped[str] = mapped_column(Text, default="")
    mobile: Mapped[str] = mapped_column(String(40), default="")
    photo: Mapped[str] = mapped_column(Text, default="")  # data URL / path
    status: Mapped[str] = mapped_column(String(20), default="Active")  # Active | Inactive
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    department: Mapped[str] = mapped_column(String(100), default="")
