"""Ingestion business logic: session lifecycle + re-entry dedup.

Services contain decision logic only; the route performs the actual DB writes
with a properly scoped session.
"""
from datetime import datetime, timedelta

from ..config import get_settings
from ..models import Event, Session
from ..schemas import EventIn

settings = get_settings()


def build_event(payload: EventIn) -> Event:
    return Event(
        event_id=payload.event_id,
        store_id=payload.store_id,
        camera_id=payload.camera_id,
        visitor_id=payload.visitor_id,
        event_type=payload.event_type.value,
        timestamp=payload.timestamp,
        zone_id=payload.zone_id,
        dwell_ms=payload.dwell_ms,
        is_staff=payload.is_staff,
        confidence=payload.confidence,
        event_metadata=payload.metadata,
    )


def is_reentry(existing: Session | None, payload: EventIn) -> bool:
    """Treat a near-immediate re-entry as the same session to avoid double counting."""
    if existing is None or existing.exit_time is None:
        return False
    delta = payload.timestamp - existing.exit_time
    return delta < timedelta(seconds=settings.reentry_window_seconds)


def apply_session_update(existing: Session | None, payload: EventIn) -> Session:
    """Return a session object reflecting this event (new or mutated existing)."""
    if existing is None:
        return Session(
            visitor_id=payload.visitor_id,
            store_id=payload.store_id,
            entry_time=payload.timestamp,
        )
    if payload.event_type.value == "EXIT":
        existing.exit_time = payload.timestamp
    elif is_reentry(existing, payload):
        existing.exit_time = None  # resume the same session
    return existing


def should_count(payload: EventIn) -> bool:
    """Staff are excluded from visitor analytics."""
    return not payload.is_staff
