"""Pipeline entrypoint: CCTV → YOLOv8 → ByteTrack → events → /events/ingest.

Run against a real clip:
    python pipeline/run_pipeline.py --video data/clips/store1.mp4 --store STR-001

When OpenCV/YOLO or a video file are unavailable (e.g. CI, or the auto-startup
container), it degrades to a deterministic synthetic walk-through that still
exercises the full event → ingest → analytics path so the dashboard fills up.
"""
import argparse
import os
import random
import time
import uuid

from .event_generator import EventGenerator
from .reentry import ReentryGuard
from .staff_classifier import StaffClassifier
from .zone_mapper import ZoneMapper

INGEST_URL = os.getenv("RETAILPULSE_API_URL", "http://localhost:8000")
DWELL_EMIT_SECONDS = 30


def _real_pipeline(video: str, store_id: str, camera_id: str) -> bool:
    """Attempt the genuine CV pipeline. Returns False if deps/video missing."""
    try:
        import cv2  # noqa: F401

        from .detector import PersonDetector
        from .tracker import ByteTracker
    except Exception as exc:
        print(f"[pipeline] CV stack unavailable ({exc}); using synthetic mode")
        return False

    if not os.path.exists(video):
        print(f"[pipeline] video not found at {video}; using synthetic mode")
        return False

    import cv2

    mapper = ZoneMapper.from_layout()
    detector = PersonDetector(confidence=0.45)
    tracker = ByteTracker()
    gen = EventGenerator(store_id, camera_id, INGEST_URL)
    staff = StaffClassifier()
    reentry = ReentryGuard()

    cap = cv2.VideoCapture(video)
    last_zone: dict[int, str] = {}
    last_y: dict[int, int] = {}
    inside: set[int] = set()
    seen: set[int] = set()
    frame_idx = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        frame_idx += 1
        detections = detector.detect(frame)
        tracks = tracker.update(detections)

        for tr in tracks:
            vid = f"VIS_{tr.track_id:03d}"
            cx, cy = tr.centroid
            zone = mapper.map_centroid((cx, cy))
            is_staff = staff.is_staff(tr, zone)
            prev_y = last_y.get(tr.track_id, cy)

            if mapper.crossed_inward(prev_y, cy) and tr.track_id not in inside:
                inside.add(tr.track_id)
                etype = "REENTRY" if reentry.is_reentry(vid) else "ENTRY"
                gen.emit(vid, etype, confidence=tr.confidence, is_staff=is_staff)
                seen.add(tr.track_id)
            elif mapper.crossed_outward(prev_y, cy) and tr.track_id in inside:
                inside.discard(tr.track_id)
                reentry.record_exit(vid)
                gen.emit(vid, "EXIT", confidence=tr.confidence, is_staff=is_staff)

            if zone and last_zone.get(tr.track_id) != zone:
                if tr.track_id in last_zone:
                    gen.emit(vid, "ZONE_EXIT", zone_id=last_zone[tr.track_id], is_staff=is_staff)
                gen.emit(vid, "ZONE_ENTER", zone_id=zone, confidence=tr.confidence, is_staff=is_staff)
                last_zone[tr.track_id] = zone

            last_y[tr.track_id] = cy

        if frame_idx % 150 == 0:
            gen.flush()

    cap.release()
    flushed = gen.flush()
    print(f"[pipeline] real run complete — {len(seen)} visitors, events ingested")
    return True


def _synthetic_pipeline(store_id: str, camera_id: str, visitors: int = 60) -> None:
    """Deterministic-ish walk-through used for auto-startup / no-video runs."""
    mapper = ZoneMapper.from_layout()
    gen = EventGenerator(store_id, camera_id, INGEST_URL)
    zones = [z.zone_id for z in mapper.zones]
    print(f"[pipeline] synthetic mode — generating ~{visitors} visitor journeys")

    for i in range(visitors):
        vid = f"VIS_{i + 1:03d}"
        is_staff = random.random() < 0.1
        gen.emit(vid, "ENTRY", confidence=round(random.uniform(0.5, 0.99), 2), is_staff=is_staff)
        journey = random.sample(zones, k=random.randint(2, len(zones)))
        for z in journey:
            gen.emit(vid, "ZONE_ENTER", zone_id=z, is_staff=is_staff,
                     confidence=round(random.uniform(0.5, 0.99), 2))
            if random.random() < 0.5:
                gen.emit(vid, "ZONE_DWELL", zone_id=z, dwell_ms=random.randint(5000, 300000),
                         is_staff=is_staff)
            gen.emit(vid, "ZONE_EXIT", zone_id=z, is_staff=is_staff)
        if random.random() < 0.25:
            gen.emit(vid, "QUEUE_SPIKE", zone_id="Z5", is_staff=is_staff)
        gen.emit(vid, "EXIT", is_staff=is_staff, confidence=round(random.uniform(0.5, 0.99), 2))
        if i % 10 == 0:
            gen.flush()

    count = gen.flush()
    print(f"[pipeline] synthetic run complete — flushed final batch ({count} events)")


def main() -> None:
    parser = argparse.ArgumentParser(description="RetailPulse CCTV pipeline")
    parser.add_argument("--video", default=os.getenv("RETAILPULSE_CLIP", "data/clips/store1.mp4"))
    parser.add_argument("--store", default="STR-001")
    parser.add_argument("--camera", default="CAM_ENTRY_01")
    parser.add_argument("--synthetic", action="store_true", help="force synthetic mode")
    args = parser.parse_args()

    if args.synthetic or not _real_pipeline(args.video, args.store, args.camera):
        _synthetic_pipeline(args.store, args.camera)


if __name__ == "__main__":
    main()
