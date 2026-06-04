"""Event ingestion REST API + event listing."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..database.session import get_db
from ..logging_config import get_logger
from ..models import Event, Session
from ..schemas import EventIn, EventOut
from ..services import ingest_service
from ..services.ws_manager import manager

router = APIRouter(prefix="/events", tags=["events"])
logger = get_logger("routes.events")


def _persist(payload: EventIn, db: DbSession) -> Event:
    existing = (
        db.query(Session)
        .filter(Session.visitor_id == payload.visitor_id)
        .one_or_none()
    )
    session = ingest_service.apply_session_update(existing, payload)
    if existing is None:
        db.add(session)
    event = ingest_service.build_event(payload)
    db.add(event)
    return event


@router.post("/ingest", status_code=201)
async def ingest_batch(
    body: dict,
    db: DbSession = Depends(get_db),
) -> dict:
    """Batch ingestion used by the pipeline and the startup seeder."""
    raw = body.get("events", [])
    ingested = 0
    try:
        for item in raw:
            _persist(EventIn(**item), db)
            ingested += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("batch ingest failed")
        raise HTTPException(status_code=500, detail="Batch ingest failed") from exc
    logger.info("batch ingested", extra={"context": {"count": ingested}})
    return {"ingested": ingested}


@router.post("", response_model=EventOut, status_code=201)
async def ingest_event(
    payload: EventIn,
    background: BackgroundTasks,
    db: DbSession = Depends(get_db),
) -> EventOut:
    try:
        existing = (
            db.query(Session)
            .filter(Session.visitor_id == payload.visitor_id)
            .one_or_none()
        )
        session = ingest_service.apply_session_update(existing, payload)
        if existing is None:
            db.add(session)

        event = ingest_service.build_event(payload)
        db.add(event)
        db.commit()
        db.refresh(event)

        background.add_task(
            _notify, payload.store_id, payload.event_type.value
        )
        logger.info(
            "event ingested",
            extra={"context": {"store_id": payload.store_id, "type": payload.event_type.value}},
        )
        return EventOut(id=event.id, **payload.model_dump())
    except Exception as exc:  # production-aware error handling
        db.rollback()
        logger.exception("ingest failed")
        raise HTTPException(status_code=500, detail="Failed to ingest event") from exc


@router.get("", response_model=list[EventOut])
def list_events(
    store_id: str | None = None,
    limit: int = 100,
    db: DbSession = Depends(get_db),
) -> list[EventOut]:
    query = db.query(Event)
    if store_id:
        query = query.filter(Event.store_id == store_id)
    rows = query.order_by(Event.timestamp.desc()).limit(limit).all()
    return [
        EventOut(
            id=r.id,
            event_id=r.event_id,
            store_id=r.store_id,
            camera_id=r.camera_id,
            visitor_id=r.visitor_id,
            event_type=r.event_type,
            timestamp=r.timestamp,
            zone_id=r.zone_id,
            dwell_ms=r.dwell_ms,
            is_staff=r.is_staff,
            confidence=r.confidence,
            metadata=r.event_metadata or {},
        )
        for r in rows
    ]


async def _notify(store_id: str, event_type: str) -> None:
    await manager.broadcast({"channel": "events", "store_id": store_id, "type": event_type})
