"""Analytics endpoints: metrics, funnel, heatmap, anomalies."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from ..analytics import anomaly_engine, funnel_engine, heatmap_engine, metrics_engine
from ..database.session import get_db
from ..models import Event, Session
from ..schemas import AnomalyOut, FunnelStageOut, StoreMetricsOut, ZoneHeatOut

router = APIRouter(prefix="/analytics", tags=["analytics"])

STORE_NAMES = {
    "STR-001": "Downtown Flagship",
    "STR-002": "Riverside Mall",
    "STR-003": "Airport Terminal 2",
    "STR-004": "Suburbia Plaza",
    "STR-005": "Harbor Outlet",
}


def _load(db: DbSession, store_id: str | None):
    ev = db.query(Event)
    se = db.query(Session)
    if store_id:
        ev = ev.filter(Event.store_id == store_id)
        se = se.filter(Session.store_id == store_id)
    return ev.all(), se.all()


@router.get("/metrics", response_model=list[StoreMetricsOut])
def metrics(db: DbSession = Depends(get_db)) -> list[StoreMetricsOut]:
    events, sessions = _load(db, None)
    grouped = metrics_engine.group_events_by_store(events)
    sess_by_store: dict[str, list[Session]] = {}
    for s in sessions:
        sess_by_store.setdefault(s.store_id, []).append(s)

    out = []
    for store_id, name in STORE_NAMES.items():
        out.append(
            StoreMetricsOut(
                **metrics_engine.compute_store_metrics(
                    store_id,
                    name,
                    grouped.get(store_id, []),
                    sess_by_store.get(store_id, []),
                )
            )
        )
    return out


@router.get("/funnel", response_model=list[FunnelStageOut])
def funnel(store_id: str | None = None, db: DbSession = Depends(get_db)):
    events, sessions = _load(db, store_id)
    return [FunnelStageOut(**s) for s in funnel_engine.build_funnel(sessions, events)]


@router.get("/heatmap", response_model=list[ZoneHeatOut])
def heatmap(store_id: str | None = None, db: DbSession = Depends(get_db)):
    events, _ = _load(db, store_id)
    return [ZoneHeatOut(**z) for z in heatmap_engine.build_heatmap(events)]


@router.get("/anomalies", response_model=list[AnomalyOut])
def anomalies(store_id: str | None = None, db: DbSession = Depends(get_db)):
    events, _ = _load(db, store_id)
    detected = anomaly_engine.detect_anomalies(events)
    for a in detected:
        a["store_name"] = STORE_NAMES.get(a["store_id"], a["store_id"])
    return [AnomalyOut(**a) for a in detected]
