"""Event model — raw detections from the CV pipeline (Document 05)."""
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..database.session import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    event_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    store_id: Mapped[str] = mapped_column(String, nullable=False)
    camera_id: Mapped[str] = mapped_column(String, nullable=False)
    visitor_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.visitor_id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    zone_id: Mapped[str | None] = mapped_column(String, nullable=True)
    dwell_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    __table_args__ = (
        Index("ix_events_store_id", "store_id"),
        Index("ix_events_timestamp", "timestamp"),
        Index("ix_events_visitor_id", "visitor_id"),
    )
