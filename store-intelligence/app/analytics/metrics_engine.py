"""Real-time store metrics computed from event/session records. Pure functions."""
from collections import defaultdict
from datetime import datetime

from ..models import Event, Session


def compute_store_metrics(
    store_id: str,
    store_name: str,
    events: list[Event],
    sessions: list[Session],
) -> dict:
    """Aggregate raw records into the live metric surface for one store."""
    visitor_count = len({s.visitor_id for s in sessions})
    active = sum(1 for s in sessions if s.exit_time is None)
    converted = [s for s in sessions if s.is_converted]
    conversion_rate = len(converted) / visitor_count if visitor_count else 0.0
    revenue = sum(s.purchase_amount or 0.0 for s in converted)

    dwell_events = [e.dwell_ms for e in events if e.dwell_ms]
    avg_dwell = (sum(dwell_events) / len(dwell_events) / 1000) if dwell_events else 0.0

    queue_depth = max(
        (1 for e in events if e.event_type == "QUEUE_SPIKE"),
        default=0,
    )

    return {
        "store_id": store_id,
        "store_name": store_name,
        "visitor_count": visitor_count,
        "active_visitors": active,
        "conversion_rate": round(conversion_rate, 4),
        "avg_dwell_seconds": round(avg_dwell, 1),
        "queue_depth": queue_depth,
        "revenue": round(revenue, 2),
        "trend": 0.0,
        "status": "online",
    }


def group_events_by_store(events: list[Event]) -> dict[str, list[Event]]:
    grouped: dict[str, list[Event]] = defaultdict(list)
    for e in events:
        grouped[e.store_id].append(e)
    return grouped


def events_in_window(events: list[Event], start: datetime, end: datetime) -> list[Event]:
    return [e for e in events if start <= e.timestamp <= end]
