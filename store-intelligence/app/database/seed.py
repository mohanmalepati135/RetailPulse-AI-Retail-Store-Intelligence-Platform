"""Auto-seed synthetic events on cold start so the dashboard is never empty.

Seeding goes through the same persistence path as ingestion (sessions + events),
mirroring how the real pipeline would populate the database.
"""
import random
import uuid
from datetime import datetime, timedelta

from ..constants import CAMERA_LABELS, STORE_CAMERAS, STORE_NAMES, ZONES
from ..logging_config import get_logger
from ..models import Event, Session
from ..schemas import EventIn
from ..services import ingest_service
from .session import SessionLocal

logger = get_logger("seed")

EVENTS_PER_STORE = 220
EVENT_TYPES = ["ENTRY", "EXIT", "ZONE_ENTER", "ZONE_EXIT", "DWELL", "QUEUE_SPIKE"]


def _synthetic_event(store_id: str, when: datetime) -> EventIn:
    event_type = random.choice(EVENT_TYPES)
    zone = None if event_type in ("ENTRY", "EXIT") else random.choice(ZONES)
    return EventIn(
        event_id=f"evt_{uuid.uuid4().hex[:10]}",
        store_id=store_id,
        camera_id=random.choice(CAMERA_LABELS),
        visitor_id=f"vis_{uuid.uuid4().hex[:10]}",
        event_type=event_type,
        timestamp=when,
        zone_id=zone,
        dwell_ms=random.randint(2000, 320000) if event_type == "DWELL" else None,
        is_staff=random.random() < 0.12,
        confidence=round(random.uniform(0.4, 0.99), 2),
        metadata={"seeded": True},
    )


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if db.query(Event).count() > 0:
            return
        now = datetime.utcnow()
        for store_id in STORE_NAMES:
            for _ in range(EVENTS_PER_STORE):
                offset = timedelta(minutes=random.randint(0, 24 * 60))
                payload = _synthetic_event(store_id, now - offset)
                existing = (
                    db.query(Session)
                    .filter(Session.visitor_id == payload.visitor_id)
                    .one_or_none()
                )
                session = ingest_service.apply_session_update(existing, payload)
                # Mark a realistic share of visitors as converted.
                if payload.event_type == "EXIT" and random.random() < 0.27:
                    session.is_converted = True
                    session.purchase_amount = round(random.uniform(20, 180), 2)
                if existing is None:
                    db.add(session)
                db.add(ingest_service.build_event(payload))
            db.commit()
        logger.info(
            "database seeded",
            extra={"context": {"events": EVENTS_PER_STORE * len(STORE_NAMES)}},
        )
    except Exception:
        db.rollback()
        logger.exception("seed failed")
    finally:
        db.close()


# Camera count is referenced by tests/sanity checks.
TOTAL_CAMERAS = sum(STORE_CAMERAS.values())
