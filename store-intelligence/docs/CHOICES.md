# CHOICES.md — Decisions, Alternatives, and AI Collaboration

## 1. Detection model

**Options considered**
- YOLOv8n (chosen)
- YOLOv8m/l — higher accuracy, much slower on CPU
- Detectron2 / RT-DETR — heavier, longer setup
- Classical HOG/background subtraction — brittle in real retail lighting

**Why YOLOv8n**
Best accuracy-per-millisecond for *person* detection on CPU, one-line Ultralytics
API, and easy to explain. Retail person-counting does not need a large model;
spending the complexity budget on tracking and analytics pays off more.

**AI input:** suggested YOLOv8 + ByteTrack as the standard pairing — **accepted**.
Rejected an AI suggestion to add re-ID embeddings for multi-camera matching as
out-of-scope for the timebox (kept as a documented "nice to have").

## 2. Tracking

ByteTrack chosen over SORT/DeepSORT. SORT loses identities under occlusion;
DeepSORT adds an appearance model (heavier). ByteTrack's two-stage association
recovers low-confidence boxes — strong in crowds — with no extra model. Track
lifecycle (birth/age/death) is owned by our wrapper, keeping `run_pipeline`
readable.

## 3. Event schema

Adopted the challenge schema verbatim (`event_id`, `store_id`, `camera_id`,
`visitor_id`, `event_type`, `timestamp`, `zone_id`, `dwell_ms`, `is_staff`,
`confidence`, `metadata`).

Decisions:
- `REENTRY` and `ZONE_DWELL` are emitted semantically by the pipeline but
  **persisted** as `ENTRY`/`DWELL` with a `metadata` flag — keeps the stored
  enum small while preserving intent. Documented so reviewers aren't surprised.
- `metadata` is a JSON column for forward-compatible, non-indexed extras (bbox, reentry).

## 4. API architecture

- **Service layer separated** from routes and models. Routes do HTTP + session
  scoping; services do logic; analytics are pure functions. This made the test
  suite small and fast (pure functions need no DB).
- **Batch `/events/ingest`** added alongside single `/events` — the pipeline and
  seeder push batches; idempotency is enforced by a unique `event_id`.
- **Per-store routes** (`/stores/{id}/...`) match the challenge spec; aggregate
  routes power the landing dashboard.

**AI input:** proposed a generic `/query` analytics endpoint — **rejected** in
favour of explicit, typed, cache-friendly resource routes that map cleanly to the
dashboard pages.

## 5. Database

SQLite for zero-ops demo portability. Indexed on `store_id`, `timestamp`,
`visitor_id` (and on transactions). ORM models keep a clean migration path to
Postgres. Considered DuckDB for analytics speed — unnecessary at this scale.

## 6. Conversion logic

Rule: BILLING-zone presence within 5 minutes before a CSV purchase ⇒ converted.
Chosen over naive "any purchase counts" because it ties POS revenue to actual
observed visitor behaviour. If no CSV is supplied, transactions are synthesised
from real BILLING visits so the funnel still reflects input data — never hardcoded.

## 7. Frontend data layer

- **Axios + TanStack Query** with env-driven base URL, caching, retries, and
  polling intervals (5s/10s/15s).
- **Demo-mode fallback**: a `dataSource` orchestrator tries the real backend
  first and only falls back to `mockEngine.ts` on failure, flipping a banner.
  This satisfies "real backend is source of truth, mock is fallback only".

**AI input:** suggested replacing the existing hand-rolled `useApiData` hook with
React Query — **accepted**, but the existing component contract
(`{ data, loading, error, refetch }`) was preserved via a thin adapter so **no UI
was redesigned**.

## 8. Realtime

Polling over websockets as the primary mechanism — simpler and resilient. A WS
relay is included and used for health/connection signalling. We explicitly chose
not to overengineer streaming.

## Summary of tradeoffs

| Area | Chose | Gave up | Why |
| --- | --- | --- | --- |
| Model | YOLOv8n | Higher accuracy | Speed + explainability in timebox |
| Tracking | ByteTrack | Multi-cam re-ID | Strong single-cam ids, less complexity |
| DB | SQLite | Concurrency/scale | Zero-ops demo; clean upgrade path |
| Realtime | Polling | Push everywhere | Simplicity + resilience |
| Mock data | Fallback only | — | Real backend stays source of truth |
