"""Pydantic v2 schemas for event ingestion — no raw dicts cross boundaries."""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class EventType(str, Enum):
    ENTRY = "ENTRY"
    EXIT = "EXIT"
    ZONE_ENTER = "ZONE_ENTER"
    ZONE_EXIT = "ZONE_EXIT"
    DWELL = "DWELL"
    QUEUE_SPIKE = "QUEUE_SPIKE"


class EventIn(BaseModel):
    event_id: str
    store_id: str
    camera_id: str
    visitor_id: str
    event_type: EventType
    timestamp: datetime
    zone_id: str | None = None
    dwell_ms: int | None = None
    is_staff: bool = False
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class EventOut(EventIn):
    id: str

    model_config = {"from_attributes": True}
