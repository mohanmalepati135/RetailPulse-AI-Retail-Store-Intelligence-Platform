// Simulated backend pipeline + analytics engine.
// Mirrors the real system: detector → tracker → event generator → ingest → metrics.
// In production this data arrives from the FastAPI backend over REST + WebSocket;
// here it is generated deterministically-ish in the browser so the UI is fully live.

import {
  STORES,
  ZONES,
  CAMERAS,
  ANOMALY_TYPES,
  QUEUE_SPIKE_THRESHOLD,
  DETECTION_CONFIDENCE_THRESHOLD,
  FUNNEL_STAGES,
} from "./constants";
import type {
  Anomaly,
  CameraFeed,
  FleetSummary,
  FunnelStage,
  Severity,
  StoreEvent,
  StoreMetrics,
  SystemHealth,
  TimePoint,
  ZoneHeat,
} from "./types";

type Listener = () => void;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T,>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
const uid = () => Math.random().toString(36).slice(2, 10);

interface StoreState {
  metrics: StoreMetrics;
  series: TimePoint[];
  zones: Record<string, ZoneHeat>;
  funnelBase: number;
}

class RetailEngine {
  private stores: Record<string, StoreState> = {};
  private events: StoreEvent[] = [];
  private anomalies: Anomaly[] = [];
  private listeners = new Set<Listener>();
  private startedAt = Date.now();
  private eventsIngested = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private subscribers = 0;

  constructor() {
    this.seed();
  }

  private seed() {
    STORES.forEach((s, idx) => {
      const visitors = randInt(120, 480);
      const conversion = rand(0.18, 0.42);
      const series: TimePoint[] = Array.from({ length: 24 }, (_, h) => {
        const peak = Math.exp(-Math.pow(h - 14, 2) / 30);
        const v = Math.round(peak * rand(30, 60) + rand(2, 10));
        return {
          time: `${String(h).padStart(2, "0")}:00`,
          visitors: v,
          conversions: Math.round(v * conversion),
          queue: Math.max(0, Math.round(peak * rand(2, 9))),
        };
      });
      const zones: Record<string, ZoneHeat> = {};
      ZONES.forEach((z) => {
        zones[z.id] = {
          zone_id: z.id,
          zone_name: z.name,
          visitors: randInt(20, 200),
          avg_dwell_seconds: randInt(20, 240),
          conversion_contribution: rand(0.05, 0.35),
        };
      });
      this.stores[s.id] = {
        metrics: {
          store_id: s.id,
          store_name: s.name,
          visitor_count: visitors,
          active_visitors: randInt(4, 60),
          conversion_rate: conversion,
          avg_dwell_seconds: randInt(90, 260),
          queue_depth: randInt(0, 8),
          revenue: Math.round(visitors * conversion * rand(35, 90)),
          trend: rand(-12, 18),
          status: idx === 3 ? "degraded" : "online",
        },
        series,
        zones,
        funnelBase: visitors,
      };
    });

    // Seed historical data so cold-load is never empty. Distribute round-robin
    // across every store so per-store (filtered) views always have records.
    STORES.forEach((s) => {
      for (let i = 0; i < 12; i++) this.generateEvent(true, s.id);
      this.maybeAnomaly(true, s.id);
    });
    // A few extra random anomalies for variety in the global feed.
    for (let i = 0; i < 4; i++) this.maybeAnomaly(true);
  }

  private generateEvent(silent = false, forceStoreId?: string) {
    const store = forceStoreId
      ? STORES.find((s) => s.id === forceStoreId) ?? pick(STORES)
      : pick(STORES);
    const eventType = pick<StoreEvent["event_type"]>([
      "ENTRY",
      "EXIT",
      "ZONE_ENTER",
      "ZONE_EXIT",
      "DWELL",
      "QUEUE_SPIKE",
    ]);
    const isStaff = Math.random() < 0.12;
    const zone =
      eventType === "ENTRY" || eventType === "EXIT" ? null : pick(ZONES).id;
    const event: StoreEvent = {
      event_id: `evt_${uid()}`,
      store_id: store.id,
      camera_id: pick(CAMERAS),
      visitor_id: `vis_${uid()}`,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      zone_id: zone,
      dwell_ms: eventType === "DWELL" ? randInt(2000, 320000) : null,
      is_staff: isStaff,
      confidence: Number(rand(DETECTION_CONFIDENCE_THRESHOLD, 0.99).toFixed(2)),
      metadata: { bbox: [randInt(0, 1280), randInt(0, 720), 80, 180] },
    };
    this.events.unshift(event);
    this.events = this.events.slice(0, 200);
    this.eventsIngested++;

    if (!isStaff) this.applyEventToMetrics(event);
    if (!silent) this.emit();
    return event;
  }

  private applyEventToMetrics(event: StoreEvent) {
    const st = this.stores[event.store_id];
    if (!st) return;
    const m = st.metrics;
    if (event.event_type === "ENTRY") {
      m.visitor_count++;
      m.active_visitors++;
    } else if (event.event_type === "EXIT") {
      m.active_visitors = Math.max(0, m.active_visitors - 1);
      if (Math.random() < m.conversion_rate) {
        m.revenue += Math.round(rand(35, 120));
      }
    } else if (event.event_type === "QUEUE_SPIKE") {
      m.queue_depth = randInt(QUEUE_SPIKE_THRESHOLD, 14);
    }
    if (event.zone_id && st.zones[event.zone_id]) {
      const z = st.zones[event.zone_id];
      if (event.event_type === "ZONE_ENTER") z.visitors++;
      if (event.dwell_ms) {
        z.avg_dwell_seconds = Math.round(
          (z.avg_dwell_seconds * 9 + event.dwell_ms / 1000) / 10,
        );
      }
    }
  }

  private maybeAnomaly(force = false, forceStoreId?: string) {
    if (!force && Math.random() > 0.25) return;
    const store = forceStoreId
      ? STORES.find((s) => s.id === forceStoreId) ?? pick(STORES)
      : pick(STORES);
    const type = pick(ANOMALY_TYPES);
    const severity: Severity =
      type === "Camera dropout" || type === "Crowd density"
        ? "CRITICAL"
        : Math.random() < 0.5
          ? "MEDIUM"
          : "LOW";
    const messages: Record<string, string> = {
      "Queue spike": `Checkout queue exceeded ${QUEUE_SPIKE_THRESHOLD} people`,
      "Dwell anomaly": "Unusual dwell time detected in zone",
      "Conversion drop": "Conversion fell sharply vs baseline",
      "Camera dropout": "Camera feed stopped responding",
      "Crowd density": "Crowd density exceeded safe threshold",
      "Abandoned zone": "High-traffic zone now showing zero engagement",
    };
    const actions: Record<string, string> = {
      "Queue spike": "Open an additional billing counter to recover conversion.",
      "Dwell anomaly": "Dispatch floor staff to assist customers in this zone.",
      "Conversion drop": "Review pricing and staffing at the affected stage.",
      "Camera dropout": "Restart the camera feed; failover analytics engaged.",
      "Crowd density": "Trigger crowd-control protocol and notify floor manager.",
      "Abandoned zone": "Inspect the display — likely a merchandising issue.",
    };
    const changes: Record<string, string> = {
      "Queue spike": `Queue length increased ${randInt(120, 260)}% in the last ${randInt(5, 12)} min`,
      "Dwell anomaly": `Dwell up ${randInt(40, 90)}% vs hourly baseline`,
      "Conversion drop": `Conversion down ${randInt(15, 38)}% vs baseline`,
      "Camera dropout": `No frames received for ${randInt(20, 120)}s`,
      "Crowd density": `Density ${randInt(110, 180)}% of safe ceiling`,
      "Abandoned zone": `Detections dropped to 0 over ${randInt(8, 20)} min`,
    };
    const zone = type === "Camera dropout" ? null : pick(ZONES).id;
    const anomaly: Anomaly = {
      id: `anm_${uid()}`,
      store_id: store.id,
      store_name: store.name,
      type,
      severity,
      message: messages[type],
      explanation: this.explain(type, severity, store.name),
      suggested_action: actions[type],
      confidence: Number(rand(0.78, 0.99).toFixed(2)),
      metric_change: changes[type],
      zone_id: zone,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.anomalies.unshift(anomaly);
    this.anomalies = this.anomalies.slice(0, 60);
  }

  private explain(type: string, sev: Severity, store: string) {
    const map: Record<string, string> = {
      "Queue spike": `Detected sustained queue growth at ${store}. Recommend opening an additional register to recover conversion.`,
      "Dwell anomaly": `Dwell time deviates >2σ from the zone's hourly baseline at ${store}, suggesting either high interest or product confusion.`,
      "Conversion drop": `Funnel drop-off concentrated between product interaction and checkout at ${store}. Possible pricing or staffing issue.`,
      "Camera dropout": `Heartbeat lost from camera at ${store}. Pipeline failover engaged; affected zone analytics are paused.`,
      "Crowd density": `Person density per m² exceeded the configured ceiling at ${store}. Safety escalation triggered.`,
      "Abandoned zone": `A previously busy zone at ${store} dropped to zero detections — likely a display or merchandising issue.`,
    };
    return `[${sev}] ${map[type]}`;
  }

  // ---- Public read API (mirrors REST endpoints) ----

  getAllMetrics(): StoreMetrics[] {
    return Object.values(this.stores).map((s) => ({ ...s.metrics }));
  }

  getStoreMetrics(id: string): StoreMetrics | null {
    return this.stores[id] ? { ...this.stores[id].metrics } : null;
  }

  getStoreSeries(id: string): TimePoint[] {
    return this.stores[id]?.series ?? [];
  }

  getAggregatedSeries(): TimePoint[] {
    const all = Object.values(this.stores);
    if (all.length === 0) return [];
    const len = all[0].series.length;
    return Array.from({ length: len }, (_, i) => {
      const point: TimePoint = {
        time: all[0].series[i].time,
        visitors: 0,
        conversions: 0,
        queue: 0,
      };
      all.forEach((s) => {
        point.visitors += s.series[i].visitors;
        point.conversions += s.series[i].conversions;
        point.queue += s.series[i].queue;
      });
      return point;
    });
  }

  getEvents(storeId?: string): StoreEvent[] {
    return storeId
      ? this.events.filter((e) => e.store_id === storeId)
      : this.events;
  }

  getFunnel(storeId?: string): FunnelStage[] {
    const stores = storeId
      ? [this.stores[storeId]].filter(Boolean)
      : Object.values(this.stores);
    const base = stores.reduce((acc, s) => acc + (s?.funnelBase ?? 0), 0) || 1;
    const ratios = [1, 0.78, 0.54, 0.36, 0.27];
    let prev = 0;
    return FUNNEL_STAGES.map((stage, i) => {
      const count = Math.round(base * ratios[i]);
      const rate = i === 0 ? 1 : prev ? count / prev : 0;
      prev = count;
      return { stage, count, rate };
    });
  }

  getHeatmap(storeId?: string): ZoneHeat[] {
    if (storeId) return Object.values(this.stores[storeId]?.zones ?? {});
    const agg: Record<string, ZoneHeat> = {};
    Object.values(this.stores).forEach((s) =>
      Object.values(s.zones).forEach((z) => {
        if (!agg[z.zone_id])
          agg[z.zone_id] = { ...z, visitors: 0, avg_dwell_seconds: 0 };
        agg[z.zone_id].visitors += z.visitors;
        agg[z.zone_id].avg_dwell_seconds = Math.round(
          (agg[z.zone_id].avg_dwell_seconds + z.avg_dwell_seconds) / 2,
        );
        agg[z.zone_id].conversion_contribution = Math.max(
          agg[z.zone_id].conversion_contribution,
          z.conversion_contribution,
        );
      }),
    );
    return Object.values(agg);
  }

  getAnomalies(storeId?: string): Anomaly[] {
    return storeId
      ? this.anomalies.filter((a) => a.store_id === storeId)
      : [...this.anomalies];
  }

  getSparkline(storeId: string, key: "visitors" | "conversions" | "queue") {
    const series = this.stores[storeId]?.series ?? [];
    return series.slice(-14).map((p, i) => ({ i, v: p[key] }));
  }

  getAggregatedSparkline(key: "visitors" | "conversions" | "queue") {
    const agg = this.getAggregatedSeries();
    return agg.slice(-14).map((p, i) => ({ i, v: p[key] }));
  }

  getCameraFeeds(): CameraFeed[] {
    const labels = [
      "CAM_ENTRY_01",
      "CAM_FLOOR_02",
      "CAM_BILLING_03",
      "CAM_AISLE_04",
      "CAM_FITTING_05",
    ];
    const feeds: CameraFeed[] = [];
    STORES.forEach((store, si) => {
      const count = Math.min(store.cameras, 5);
      for (let i = 0; i < count; i++) {
        // One warning + one offline sprinkled across the fleet, rest healthy.
        const globalIdx = si * 5 + i;
        const status: CameraFeed["status"] =
          globalIdx === 2 ? "warning" : globalIdx === 11 ? "offline" : "healthy";
        feeds.push({
          id: `${store.id}-${labels[i % labels.length]}`,
          label: labels[i % labels.length],
          store_id: store.id,
          store_name: store.name,
          status,
          latency_ms:
            status === "offline"
              ? 0
              : status === "warning"
                ? randInt(180, 320)
                : randInt(20, 80),
          fps: status === "offline" ? 0 : Number(rand(22, 30).toFixed(1)),
          last_frame_seconds:
            status === "offline"
              ? randInt(40, 180)
              : status === "warning"
                ? randInt(4, 12)
                : randInt(0, 2),
        });
      }
    });
    return feeds;
  }

  getFleetSummary(): FleetSummary {
    const feeds = this.getCameraFeeds();
    const online = feeds.filter((f) => f.status !== "offline").length;
    return {
      stores_active: STORES.length,
      cameras_online: online,
      cameras_total: feeds.length,
      feed_health: feeds.length ? online / feeds.length : 0,
    };
  }

  acknowledgeAnomaly(id: string) {
    const a = this.anomalies.find((x) => x.id === id);
    if (a) a.acknowledged = true;
    this.emit();
  }

  acknowledgeAll() {
    this.anomalies.forEach((a) => (a.acknowledged = true));
    this.emit();
  }

  getHealth(): SystemHealth {
    const uptime = Math.floor((Date.now() - this.startedAt) / 1000);
    return {
      uptime_seconds: uptime,
      events_ingested: this.eventsIngested,
      events_per_minute: randInt(40, 120),
      pipeline_fps: Number(rand(22, 30).toFixed(1)),
      components: [
        {
          name: "Ingest API (FastAPI)",
          status: "healthy",
          latency_ms: randInt(4, 22),
          detail: "REST ingest accepting events",
        },
        {
          name: "Database (SQLite)",
          status: "healthy",
          latency_ms: randInt(1, 9),
          detail: "Indexed on store_id, timestamp, visitor_id",
        },
        {
          name: "CV Pipeline (YOLOv8 + ByteTrack)",
          status: "healthy",
          latency_ms: randInt(30, 70),
          detail: `Inference @ ${rand(22, 30).toFixed(1)} fps`,
        },
        {
          name: "WebSocket relay",
          status: this.subscribers > 0 ? "healthy" : "degraded",
          latency_ms: randInt(2, 15),
          detail: `${this.subscribers} dashboard client(s) connected`,
        },
        {
          name: "Camera fleet",
          status: "degraded",
          latency_ms: randInt(40, 120),
          detail: "1 of 26 cameras reconnecting",
        },
      ],
    };
  }

  // ---- Live relay (mirrors WebSocket) ----

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.subscribers = this.listeners.size;
    this.ensureRunning();
    return () => {
      this.listeners.delete(listener);
      this.subscribers = this.listeners.size;
    };
  }

  private ensureRunning() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const burst = randInt(1, 4);
      for (let i = 0; i < burst; i++) this.generateEvent(true);
      this.maybeAnomaly();
      this.driftMetrics();
      this.emit();
    }, 2000);
  }

  private driftMetrics() {
    Object.values(this.stores).forEach((s) => {
      const m = s.metrics;
      m.active_visitors = Math.max(
        0,
        m.active_visitors + randInt(-3, 4),
      );
      m.queue_depth = Math.max(0, Math.min(14, m.queue_depth + randInt(-2, 2)));
      m.conversion_rate = Math.min(
        0.6,
        Math.max(0.1, m.conversion_rate + rand(-0.01, 0.01)),
      );
      m.trend = m.trend + rand(-1.5, 1.5);
    });
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

export const engine = new RetailEngine();
