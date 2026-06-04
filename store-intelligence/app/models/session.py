"""Visitor session lifecycle model."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..database.session import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visitor_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    store_id: Mapped[str] = mapped_column(String, nullable=False)
    entry_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    exit_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_converted: Mapped[bool] = mapped_column(Boolean, default=False)
    purchase_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
