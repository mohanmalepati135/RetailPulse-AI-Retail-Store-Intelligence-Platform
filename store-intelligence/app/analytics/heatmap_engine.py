"""Zone-level heatmap aggregation. Pure functions."""
from collections import defaultdict

from ..models import Event

ZONE_NAMES = {
    "Z1": "Entrance",
    "Z2": "Apparel",
    "Z3": "Electronics",
    "Z4": "Promotions",
    "Z5": "Checkout",
    "Z6": "Fitting Rooms",
}


def build_heatmap(events: list[Event]) -> list[dict]:
    visitors: dict[str, set[str]] = defaultdict(set)
    dwell: dict[str, list[int]] = defaultdict(list)

    for e in events:
        if not e.zone_id:
            continue
        if e.event_type == "ZONE_ENTER":
            visitors[e.zone_id].add(e.visitor_id)
        if e.dwell_ms:
            dwell[e.zone_id].append(e.dwell_ms)

    total_visitors = sum(len(v) for v in visitors.values()) or 1
    result = []
    for zone_id, name in ZONE_NAMES.items():
        v = len(visitors.get(zone_id, set()))
        d = dwell.get(zone_id, [])
        result.append(
            {
                "zone_id": zone_id,
                "zone_name": name,
                "visitors": v,
                "avg_dwell_seconds": round(sum(d) / len(d) / 1000, 1) if d else 0.0,
                "conversion_contribution": round(v / total_visitors, 4),
            }
        )
    return result
