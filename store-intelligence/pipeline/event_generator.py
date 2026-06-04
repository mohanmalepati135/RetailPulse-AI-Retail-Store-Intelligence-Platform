"""Event construction + POST to the ingest API.

Translates tracker output into the challenge event schema and batches them to
POST /events/ingest. Network failures are logged but never crash the pipeline.
"""
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

import httpx

EVENT_TYPES = (
    "ENTRY",
    "EXIT",
    "REENTRY",
    "ZONE_ENTER",
    "ZONE_EXIT",
    "ZONE_DWELL",
    "DWELL",
    "QUEUE_SPIKE",
)


@dataclass
class StoreEvent:
    store_id: str
    camera_id: str
    visitor_id: str
    event_type: str
    timestamp: str
    zone_id: str | None = None
    dwell_ms: int | None = None
    is_staff: bool = False
    confidence: float | None = None
    event_id: str = field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:10]}")
    metadata: dict[str, Any] = field(default_factory=dict)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class EventGenerator:
    def __init__(self, store_id: str, camera_id: str, ingest_url: str):
        self.store_id = store_id
        self.camera_id = camera_id
        self.ingest_url = ingest_url
        self._buffer: list[StoreEvent] = []

    def emit(
        self,
        visitor_id: str,
        event_type: str,
        *,
        zone_id: str | None = None,
        dwell_ms: int | None = None,
        is_staff: bool = False,
        confidence: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> StoreEvent:
        assert event_type in EVENT_TYPES, f"unknown event type {event_type}"
        # REENTRY persists as ENTRY downstream, flagged in metadata.
        meta = dict(metadata or {})
        persisted_type = event_type
        if event_type == "REENTRY":
            persisted_type = "ENTRY"
            meta["reentry"] = True
        if event_type in ("ZONE_DWELL",):
            persisted_type = "DWELL"
        event = StoreEvent(
            store_id=self.store_id,
            camera_id=self.camera_id,
            visitor_id=visitor_id,
            event_type=persisted_type,
            timestamp=now_iso(),
            zone_id=zone_id,
            dwell_ms=dwell_ms,
            is_staff=is_staff,
            confidence=confidence,
            metadata=meta,
        )
        self._buffer.append(event)
        return event

    def flush(self) -> int:
        if not self._buffer:
            return 0
        payload = {"events": [asdict(e) for e in self._buffer]}
        try:
            resp = httpx.post(f"{self.ingest_url}/events/ingest", json=payload, timeout=10)
            resp.raise_for_status()
            count = len(self._buffer)
            self._buffer.clear()
            return count
        except Exception as exc:  # pragma: no cover - network dependent
            print(f"[event_generator] ingest failed: {exc}")
            return 0
