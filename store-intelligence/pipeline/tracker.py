"""ByteTrack integration with track lifecycle management."""
from dataclasses import dataclass, field

from .detector import Detection


@dataclass
class Track:
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    age: int = 0
    misses: int = 0
    history: list[tuple[int, int]] = field(default_factory=list)

    @property
    def centroid(self) -> tuple[int, int]:
        x, y, w, h = self.bbox
        return x + w // 2, y + h // 2


class ByteTracker:
    """Thin lifecycle wrapper around a ByteTrack association step.

    The matching math lives in the upstream `bytetrack` package; this class owns
    track birth, ageing, and death so the rest of the pipeline stays simple.
    """

    def __init__(self, max_misses: int = 30):
        self.max_misses = max_misses
        self._next_id = 1
        self._tracks: dict[int, Track] = {}

    def update(self, detections: list[Detection]) -> list[Track]:
        # Placeholder association: in production ByteTrack's IoU + Kalman step
        # produces the detection→track assignment used below.
        matched = self._associate(detections)

        for track_id, det in matched.items():
            track = self._tracks[track_id]
            track.bbox = det.bbox
            track.confidence = det.confidence
            track.age += 1
            track.misses = 0
            track.history.append(track.centroid)

        for track_id in list(self._tracks):
            if track_id not in matched:
                self._tracks[track_id].misses += 1
                if self._tracks[track_id].misses > self.max_misses:
                    del self._tracks[track_id]

        return list(self._tracks.values())

    def _associate(self, detections: list[Detection]) -> dict[int, Detection]:
        assignment: dict[int, Detection] = {}
        for det in detections:
            track_id = self._next_id
            self._next_id += 1
            self._tracks[track_id] = Track(
                track_id=track_id, bbox=det.bbox, confidence=det.confidence
            )
            assignment[track_id] = det
        return assignment
