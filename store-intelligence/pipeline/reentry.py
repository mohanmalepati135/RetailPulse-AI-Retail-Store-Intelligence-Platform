"""Re-entry dedup to prevent double-counting the same visitor."""
import time


class ReentryGuard:
    """Tracks recently-exited visitors within a configurable window."""

    def __init__(self, window_seconds: int = 120):
        self.window_seconds = window_seconds
        self._recent_exits: dict[str, float] = {}

    def record_exit(self, visitor_id: str) -> None:
        self._recent_exits[visitor_id] = time.time()

    def is_reentry(self, visitor_id: str) -> bool:
        ts = self._recent_exits.get(visitor_id)
        if ts is None:
            return False
        return (time.time() - ts) < self.window_seconds

    def prune(self) -> None:
        now = time.time()
        self._recent_exits = {
            v: t for v, t in self._recent_exits.items() if now - t < self.window_seconds
        }
