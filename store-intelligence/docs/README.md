# RetailPulse AI — Retail Store Intelligence Platform

Transforms raw CCTV footage into live retail business intelligence: visitor
analytics, conversion funnels, zone heatmaps, queue intelligence, and rule-based
anomaly detection — surfaced on a real-time React dashboard.

```
CCTV clip → YOLOv8 → ByteTrack → Entry/Exit + Zone logic → Event generator
        → POST /events/ingest → FastAPI → SQLite → Analytics engine
        → REST APIs → React dashboard (TanStack Query, 5s/10s/15s polling)
```

---

## 1. Default reviewer flow (zero manual steps)

```bash
docker compose up
```

This automatically:

1. Starts the **backend** (FastAPI).
2. Initializes the **SQLite** database and indexes.
3. **Auto-seeds** realistic events if the DB is empty (so the dashboard is never blank).
4. Loads the **transactions CSV** and attributes conversions.
5. Runs the **pipeline** container — processes one CCTV clip (or a synthetic
   walk-through if no clip/CV deps are present) and POSTs events to `/events/ingest`.
6. Builds and serves the **dashboard**.

Open:

- Dashboard → http://localhost:5173
- API docs → http://localhost:8000/docs
- Health → http://localhost:8000/health

The dashboard immediately shows visitors, funnel, heatmap, anomalies, queue
depth, and camera health — **all computed from backend data**.

---

## 2. Real CCTV processing

Drop a clip at `store-intelligence/data/clips/store1.mp4`, then:

```bash
python -m pipeline.run_pipeline --video data/clips/store1.mp4 --store STR-001
```

Flow:

```
CCTV → YOLOv8 (person only) → ByteTrack (stable VIS_xxx ids)
     → directional entry/exit crossing → centroid→zone mapping
     → ENTRY / EXIT / REENTRY / ZONE_ENTER / ZONE_EXIT / ZONE_DWELL / QUEUE_SPIKE
     → batched POST /events/ingest → dashboard updates live
```

Without a clip or the CV stack, the same command falls back to a synthetic but
**non-hardcoded** generator that exercises the full ingest → analytics path.

Convert the provided store-layout Excel to the zone file:

```bash
python -m pipeline.layout_from_excel data/store_layout.xlsx
```

---

## 3. Data flow priority

1. **Real backend** (source of truth) — REST + WebSocket.
2. **Processed CCTV / seeded data** in SQLite.
3. **Demo mode** (`dashboard` `mockEngine.ts`) — fallback only, shown with a
   *"Demo Mode Active"* banner when the backend is unreachable.

The frontend base URL is environment-driven via `VITE_API_URL` (never hardcoded).

---

## 4. API surface

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | backend, DB, pipeline, camera health + last event + stale warning |
| POST | `/events` | single event ingest |
| POST | `/events/ingest` | batch ingest (pipeline + seeder) |
| GET | `/metrics` | all-store live metrics |
| GET | `/stores/{id}/metrics` | per-store metrics |
| GET | `/stores/{id}/funnel` | session-based funnel |
| GET | `/stores/{id}/heatmap` | zone frequency + dwell |
| GET | `/stores/{id}/anomalies` | severity + suggested action |
| GET | `/cameras`, `/fleet/summary` | camera fleet status |

---

## 5. Tests

```bash
cd store-intelligence
coverage run -m pytest && coverage report
```

Covers empty store, re-entry, staff exclusion, no-purchase conversion, queue
spikes, zone mapping, and ingest idempotency. Coverage target: **70%+**.

---

## 6. Project structure

```
store-intelligence/
├── app/            FastAPI backend (routes / services / models / schemas / analytics / database)
├── pipeline/       CCTV processing (detector, tracker, zone_mapper, event_generator, run_pipeline)
├── data/           transactions.csv, store_layout, CCTV clips
├── tests/          pytest suite
└── docs/           README, DESIGN.md, CHOICES.md
dashboard (repo root: src/)  React + Vite + Tailwind UI
docker-compose.yml           backend + pipeline + dashboard
```
