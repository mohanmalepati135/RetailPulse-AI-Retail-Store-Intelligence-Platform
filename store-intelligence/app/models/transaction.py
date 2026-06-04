"""Transaction model — POS purchases used for conversion attribution."""
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..database.session import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    store_id: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    basket_value: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (
        Index("ix_transactions_store_id", "store_id"),
        Index("ix_transactions_timestamp", "timestamp"),
    )
