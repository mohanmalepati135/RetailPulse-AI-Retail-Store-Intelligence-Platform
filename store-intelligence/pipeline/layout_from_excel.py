"""Convert the provided store-layout Excel file into store_layout.json.

Expected columns (case-insensitive): zone_id, name, x1, y1, x2, y2.
Falls back gracefully if openpyxl/pandas or the file is unavailable — the bundled
store_layout.json is already a valid default.

Usage:
    python -m pipeline.layout_from_excel path/to/layout.xlsx
"""
import json
import sys
from pathlib import Path

OUT = Path(__file__).with_name("store_layout.json")


def convert(xlsx_path: str) -> None:
    try:
        import pandas as pd
    except ImportError:
        print("pandas not installed; keeping existing store_layout.json")
        return

    df = pd.read_excel(xlsx_path)
    df.columns = [c.strip().lower() for c in df.columns]
    zones = [
        {
            "id": str(r["zone_id"]),
            "name": str(r["name"]).upper(),
            "x1": int(r["x1"]),
            "y1": int(r["y1"]),
            "x2": int(r["x2"]),
            "y2": int(r["y2"]),
        }
        for _, r in df.iterrows()
    ]
    layout = {
        "frame": {"width": 1280, "height": 720},
        "entry_line": {"y": 620, "direction": "vertical_cross"},
        "zones": zones,
    }
    OUT.write_text(json.dumps(layout, indent=2))
    print(f"Wrote {OUT} with {len(zones)} zones")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m pipeline.layout_from_excel <layout.xlsx>")
    else:
        convert(sys.argv[1])
