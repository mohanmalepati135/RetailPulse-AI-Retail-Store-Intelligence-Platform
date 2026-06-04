"""Hourly time-series aggregation from raw events. Pure functions."""
from ..models import Event


def build_series(events: list[Event]) -> list[dict]:
    """Bucket events into 24 hourly points of visitors / conversions / queue."""
    buckets = {
        h: {"visitors": 0, "conversions": 0, "queue": 0} for h in range(24)
    }
    for e in events:
        if not e.timestamp:
            continue
        h = e.timestamp.hour
        b = buckets[h]
        if e.event_type == "ENTRY":
            b["visitors"] += 1
        elif e.event_type == "EXIT":
            b["conversions"] += 1
        elif e.event_type == "QUEUE_SPIKE":
            b["queue"] += 1

    return [
        {
            "time": f"{h:02d}:00",
            "visitors": buckets[h]["visitors"],
            "conversions": buckets[h]["conversions"],
            "queue": buckets[h]["queue"],
        }
        for h in range(24)
    ]


def aggregate_series(per_store: list[list[dict]]) -> list[dict]:
    if not per_store:
        return [
            {"time": f"{h:02d}:00", "visitors": 0, "conversions": 0, "queue": 0}
            for h in range(24)
        ]
    base = per_store[0]
    result = []
    for i in range(len(base)):
        point = {"time": base[i]["time"], "visitors": 0, "conversions": 0, "queue": 0}
        for series in per_store:
            point["visitors"] += series[i]["visitors"]
            point["conversions"] += series[i]["conversions"]
            point["queue"] += series[i]["queue"]
        result.append(point)
    return result
