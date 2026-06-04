"""Anomaly acknowledgement endpoints.

Anomalies are derived on the fly from the event stream rather than stored, so
acknowledgement is accepted and logged for audit but not persisted. This keeps
the contract the dashboard expects without introducing a stateful store.
"""
from fastapi import APIRouter

from ..logging_config import get_logger

router = APIRouter(prefix="/anomalies", tags=["anomalies"])
logger = get_logger("routes.anomalies")


@router.post("/{anomaly_id}/acknowledge")
def acknowledge(anomaly_id: str) -> dict:
    logger.info("anomaly acknowledged", extra={"context": {"id": anomaly_id}})
    return {"ok": True, "id": anomaly_id}


@router.post("/acknowledge-all")
def acknowledge_all() -> dict:
    logger.info("all anomalies acknowledged")
    return {"ok": True}
