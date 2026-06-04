"""Staff exclusion logic.

Heuristic classifier: staff are excluded from visitor analytics. Signals include
uniform-color presence in the upper bounding box and persistent back-of-house dwell.
A learned classifier can be swapped in behind the same interface.
"""
from .tracker import Track

STAFF_ZONES = {"Z_BACKROOM", "Z_REGISTER_BEHIND"}
STAFF_PERSISTENCE_FRAMES = 900  # ~30s at 30fps


class StaffClassifier:
    def __init__(self, uniform_hint_zones: set[str] | None = None):
        self.staff_zones = uniform_hint_zones or STAFF_ZONES

    def is_staff(self, track: Track, current_zone: str | None) -> bool:
        if current_zone in self.staff_zones:
            return True
        if track.age > STAFF_PERSISTENCE_FRAMES:
            return True
        return False
