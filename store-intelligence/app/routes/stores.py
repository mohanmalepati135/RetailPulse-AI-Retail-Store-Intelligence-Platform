"""Purplle-aligned per-store + fleet metric endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..analytics import (
    funnel_engine,
    heatmap_engine,
    metrics_engine,
    series_engine,
)
from ..analytics import anomaly_engine
from ..constants import STORE_NAMES
from ..database.session import get_db
from ..models import Event, Session
from ..schemas import FunnelStageOut, StoreMetricsOut, ZoneHeatOut
from ..schemas.analytics import AnomalyOut, TimePointOut

router = APIRouter(tags=["stores"])


def _store_events(db: DbSession, store_id: str) -> list[Event]:
    return db.query(Event).filter(Event.store_id == store_id).all()


def _store_sessions(db: DbSession, store_id: str) -> list[Session]:
    return db.query(Session).filter(Session.store_id == store_id).all()


def _metrics_for(db: DbSession, store_id: str) -> StoreMetricsOut:
    if store_id not in STORE_NAMES:
        raise HTTPException(status_code=404, detail="Store not found")
    events = _store_events(db, store_id)
    sessions = _store_sessions(db, store_id)
    return StoreMetricsOut(
        **metrics_engine.compute_store_metrics(
            store_id, STORE_NAMES[store_id], events, sessions
        )
    )


@router.get("/metrics", response_model=list[StoreMetricsOut])
def all_metrics(db: DbSession = Depends(get_db)) -> list[StoreMetricsOut]:
    return [_metrics_for(db, sid) for sid in STORE_NAMES]


@router.get("/metrics/series", response_model=list[TimePointOut])
def aggregated_series(db: DbSession = Depends(get_db)) -> list[TimePointOut]:
    per_store = [
        series_engine.build_series(_store_events(db, sid)) for sid in STORE_NAMES
    ]
    return [TimePointOut(**p) for p in series_engine.aggregate_series(per_store)]


@router.get("/stores/{store_id}/metrics", response_model=StoreMetricsOut)
def store_metrics(store_id: str, db: DbSession = Depends(get_db)):
    return _metrics_for(db, store_id)


@router.get("/stores/{store_id}/funnel", response_model=list[FunnelStageOut])
def store_funnel(store_id: str, db: DbSession = Depends(get_db)):
    events = _store_events(db, store_id)
    sessions = _store_sessions(db, store_id)
    return [FunnelStageOut(**s) for s in funnel_engine.build_funnel(sessions, events)]


@router.get("/stores/{store_id}/heatmap", response_model=list[ZoneHeatOut])
def store_heatmap(store_id: str, db: DbSession = Depends(get_db)):
    events = _store_events(db, store_id)
    return [ZoneHeatOut(**z) for z in heatmap_engine.build_heatmap(events)]


@router.get("/stores/{store_id}/anomalies", response_model=list[AnomalyOut])
def store_anomalies(store_id: str, db: DbSession = Depends(get_db)):
    events = _store_events(db, store_id)
    detected = anomaly_engine.detect_anomalies(events)
    for a in detected:
        a["store_name"] = STORE_NAMES.get(a["store_id"], a["store_id"])
    return [AnomalyOut(**a) for a in detected]


@router.get("/stores/{store_id}/series", response_model=list[TimePointOut])
def store_series(store_id: str, db: DbSession = Depends(get_db)):
    events = _store_events(db, store_id)
    return [TimePointOut(**p) for p in series_engine.build_series(events)]
