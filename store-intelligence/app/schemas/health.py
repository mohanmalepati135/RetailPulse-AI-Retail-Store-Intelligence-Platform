from pydantic import BaseModel


class HealthComponentOut(BaseModel):
    name: str
    status: str
    latency_ms: int
    detail: str


class HealthOut(BaseModel):
    status: str
    uptime_seconds: int
    events_ingested: int
    events_per_minute: int
    pipeline_fps: float
    components: list[HealthComponentOut]
