# DESIGN.md — Architecture & Engineering Decisions

## System overview

RetailPulse AI is a three-tier system with a clean separation between CV
processing, the analytics API, and the dashboard.

```
┌─────────────┐   events    ┌─────────────┐   REST/WS   ┌──────────────┐
│  Pipeline   │ ──────────▶ │   Backend   │ ──────────▶ │  Dashboard   │
│ YOLOv8 +    │  /ingest    │  FastAPI +  │  polling    │ React + RQ   │
│ ByteTrack   │             │  SQLite     │             │  + fallback  │
└─────────────┘             └─────────────┘             └──────────────┘
```

The pipeline is **decoupled** from the API by the ingest contract. Anything that
can POST schema-valid events (real CV, synthetic generator, replay tool) drives
the system identically. This is the single most important design choice — it
makes the platform demoable, testable, and production-evolvable.

## Layering rules

- **Routes** handle HTTP only; they own DB session scoping via `Depends(get_db)`.
- **Services** hold business logic (session lifecycle, re-entry dedup) with no HTTP.
- **Analytics engines** are pure functions over model lists — trivially unit-testable.
- **Models / schemas** keep SQLAlchemy and Pydantic separate; no raw dicts cross
  service boundaries.

No file exceeds ~300 lines; each module has one responsibility.

## Why YOLOv8 (YOLOv8n)

- Person detection is a solved problem; `yolov8n` is fast on CPU, accurate enough,
  and trivial to run via Ultralytics.
- We only need the `person` class — no need for heavier models or custom training.
- Configurable confidence threshold lives in `config.py`, not in code.

## Why ByteTrack

- Associates detections across frames into **stable visitor IDs** (`VIS_001`),
  which is the backbone of sessions, dwell, and re-entry logic.
- Handles occlusion and crowded scenes well without re-ID embeddings — a good
  accuracy/complexity tradeoff for a 48-hour build.
- The tracker module owns track *lifecycle* (birth/age/death) so the rest of the
  pipeline stays simple.

## Why SQLite + SQLAlchemy

- Zero-ops, file-based, perfect for a self-contained `docker compose up` demo.
- SQLAlchemy ORM gives us typed models, indexes (`store_id`, `timestamp`,
  `visitor_id`), and an easy migration path to Postgres if scaled.

## Why FastAPI

- Async, Pydantic-v2 native validation, automatic OpenAPI docs, first-class
  WebSocket and BackgroundTasks support — ideal for an ingest + analytics API.

## Why a fallback demo mode

- Reviewers may run only the frontend, or the backend may be briefly down.
- The dashboard prefers the real backend and **degrades gracefully** to a
  simulated engine, clearly flagged with a banner — never a blank or broken UI.
- Priority order is explicit: real backend → seeded data → demo mode.

## Conversion attribution

A visitor is *converted* when they appear in the **BILLING** zone within 5 minutes
before a purchase in the transactions CSV. This links real POS data to CV
sessions without fabricating numbers, and drives the funnel's final stage,
conversion rate, and revenue.

## Real-time strategy

A WebSocket relay exists for push, but the dashboard primarily uses **polling**
(TanStack Query: metrics 5s, anomalies 10s, health 15s). Polling is simpler,
resilient, and entirely sufficient at this scale — we deliberately did not
overengineer realtime.

## Observability

Structured JSON logs (Rich-formatted in dev) with `trace_id`, `endpoint`,
`status_code`, and `latency_ms` per request, plus event counts at ingest.

## AI-assisted decisions

AI was used to scaffold boilerplate (schemas, route wiring, test skeletons) and
to draft the synthetic generators. All architecture boundaries, the ingest
contract, the conversion rule, and the fallback strategy were human-decided and
reviewed. Tradeoffs are documented in CHOICES.md.
