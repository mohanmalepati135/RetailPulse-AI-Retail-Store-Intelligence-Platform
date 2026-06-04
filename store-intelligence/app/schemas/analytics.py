"""Pydantic v2 schemas for analytics outputs."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    CRITICAL = "CRITICAL"


class StoreMetricsOut(BaseModel):
    store_id: str
    store_name: str
    visitor_count: int
    active_visitors: int
    conversion_rate: float
    avg_dwell_seconds: float
    queue_depth: int
    revenue: float
    trend: float
    status: str


class FunnelStageOut(BaseModel):
    stage: str
    count: int
    rate: float


class ZoneHeatOut(BaseModel):
    zone_id: str
    zone_name: str
    visitors: int
    avg_dwell_seconds: float
    conversion_contribution: float


class AnomalyOut(BaseModel):
    id: str
    store_id: str
    store_name: str
    type: str
    severity: Severity
    message: str
    explanation: str
    suggested_action: str
    confidence: float
    metric_change: str
    zone_id: str | None
    timestamp: datetime
    acknowledged: bool


class TimePointOut(BaseModel):
    time: str
    visitors: int
    conversions: int
    queue: int


class CameraFeedOut(BaseModel):
    id: str
    label: str
    store_id: str
    store_name: str
    status: str
    latency_ms: int
    fps: float
    last_frame_seconds: int


class FleetSummaryOut(BaseModel):
    stores_active: int
    cameras_online: int
    cameras_total: int
    feed_health: float
