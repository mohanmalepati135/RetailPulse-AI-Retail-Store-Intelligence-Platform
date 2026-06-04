"""Conversion funnel construction from session + event data. Pure functions."""
from ..models import Event, Session

FUNNEL_STAGES = [
    "Store entry",
    "Zone engagement",
    "Product interaction",
    "Queue / checkout",
    "Purchase",
]


def build_funnel(sessions: list[Session], events: list[Event]) -> list[dict]:
    entered = {s.visitor_id for s in sessions}
    zone_engaged = {e.visitor_id for e in events if e.event_type == "ZONE_ENTER"}
    interacted = {e.visitor_id for e in events if e.event_type == "DWELL"}
    queued = {e.visitor_id for e in events if e.event_type == "QUEUE_SPIKE"}
    purchased = {s.visitor_id for s in sessions if s.is_converted}

    stage_sets = [entered, zone_engaged, interacted, queued, purchased]
    counts = [len(s) for s in stage_sets]

    result = []
    prev = 0
    for stage, count in zip(FUNNEL_STAGES, counts):
        rate = 1.0 if prev == 0 else (count / prev if prev else 0.0)
        result.append({"stage": stage, "count": count, "rate": round(rate, 4)})
        prev = count
    return result
