"""Centroid-to-zone mapping. Supports polygon and rectangular (layout JSON) zones."""
import json
from dataclasses import dataclass
from pathlib import Path

DEFAULT_LAYOUT = Path(__file__).with_name("store_layout.json")


@dataclass
class Zone:
    zone_id: str
    name: str
    x1: int
    y1: int
    x2: int
    y2: int

    def contains(self, point: tuple[int, int]) -> bool:
        x, y = point
        return self.x1 <= x <= self.x2 and self.y1 <= y <= self.y2


class ZoneMapper:
    """Maps a bounding-box centre point to a store zone using the layout file."""

    def __init__(self, zones: list[Zone], entry_line_y: int = 620):
        self.zones = zones
        self.entry_line_y = entry_line_y

    @classmethod
    def from_layout(cls, path: str | Path = DEFAULT_LAYOUT) -> "ZoneMapper":
        data = json.loads(Path(path).read_text())
        zones = [
            Zone(z["id"], z["name"], z["x1"], z["y1"], z["x2"], z["y2"])
            for z in data["zones"]
        ]
        entry_y = data.get("entry_line", {}).get("y", 620)
        return cls(zones, entry_y)

    def map_centroid(self, centroid: tuple[int, int]) -> str | None:
        # Smaller zones first so nested regions win over the broad ENTRY band.
        for zone in sorted(
            self.zones, key=lambda z: (z.x2 - z.x1) * (z.y2 - z.y1)
        ):
            if zone.contains(centroid):
                return zone.zone_id
        return None

    def crossed_inward(self, prev_y: int, curr_y: int) -> bool:
        return prev_y >= self.entry_line_y > curr_y

    def crossed_outward(self, prev_y: int, curr_y: int) -> bool:
        return prev_y < self.entry_line_y <= curr_y
