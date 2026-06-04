"""Camera fleet status + summary endpoints."""
import random

from fastapi import APIRouter

from ..constants import CAMERA_LABELS, STORE_CAMERAS, STORE_NAMES
from ..schemas.analytics import CameraFeedOut, FleetSummaryOut

router = APIRouter(tags=["fleet"])


def _feeds() -> list[CameraFeedOut]:
    feeds: list[CameraFeedOut] = []
    global_idx = 0
    for store_id, count in STORE_CAMERAS.items():
        for i in range(min(count, len(CAMERA_LABELS))):
            status = (
                "warning"
                if global_idx == 2
                else "offline"
                if global_idx == 11
                else "healthy"
            )
            feeds.append(
                CameraFeedOut(
                    id=f"{store_id}-{CAMERA_LABELS[i]}",
                    label=CAMERA_LABELS[i],
                    store_id=store_id,
                    store_name=STORE_NAMES[store_id],
                    status=status,
                    latency_ms=0
                    if status == "offline"
                    else random.randint(180, 320)
                    if status == "warning"
                    else random.randint(20, 80),
                    fps=0.0 if status == "offline" else round(random.uniform(22, 30), 1),
                    last_frame_seconds=random.randint(40, 180)
                    if status == "offline"
                    else random.randint(0, 2),
                )
            )
            global_idx += 1
    return feeds


@router.get("/cameras", response_model=list[CameraFeedOut])
def cameras() -> list[CameraFeedOut]:
    return _feeds()


@router.get("/fleet/summary", response_model=FleetSummaryOut)
def fleet_summary() -> FleetSummaryOut:
    feeds = _feeds()
    online = sum(1 for f in feeds if f.status != "offline")
    total = len(feeds)
    return FleetSummaryOut(
        stores_active=len(STORE_NAMES),
        cameras_online=online,
        cameras_total=total,
        feed_health=round(online / total, 4) if total else 0.0,
    )
