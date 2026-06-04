// Orchestrates the data layer per the Purplle architecture:
//   1. Real backend (source of truth)
//   2. Seeded backend data
//   3. mockEngine.ts fallback (graceful degradation / demo mode)
//
// Any failure of a *core* backend call flips the app into Demo Mode and serves
// simulated analytics so the UI never breaks.

import { backend } from "./api";
import { engine } from "../lib/mockEngine";
import type {
  Anomaly,
  CameraFeed,
  FleetSummary,
  FunnelStage,
  StoreEvent,
  StoreMetrics,
  SystemHealth,
  TimePoint,
  ZoneHeat,
} from "../lib/types";

type SparkKey = "visitors" | "conversions" | "queue";

// ---- Demo-mode state (observable) ----
let demoMode = false;
let probed = false;
const listeners = new Set<() => void>();

function setDemo(active: boolean) {
  if (demoMode !== active) {
    demoMode = active;
    listeners.forEach((l) => l());
  }
}

export const demoState = {
  isActive: () => demoMode,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// When in demo mode, keep the mock engine "live" so polled reads see fresh data.
let mockLiveStarted = false;
function ensureMockLive() {
  if (!mockLiveStarted) {
    mockLiveStarted = true;
    engine.subscribe(() => {});
  }
}

/**
 * Run a core backend call. On success we are in real-backend mode; on failure
 * we degrade to the mock engine and activate Demo Mode.
 */
async function core<T>(remote: () => Promise<T>, local: () => T): Promise<T> {
  try {
    const result = await remote();
    probed = true;
    setDemo(false);
    return result;
  } catch {
    probed = true;
    setDemo(true);
    ensureMockLive();
    return local();
  }
}

/**
 * Auxiliary (presentation-only) reads. These prefer the backend when it is
 * known to be online, but never themselves trigger Demo Mode — they simply use
 * the mock engine while degraded so the richer UI keeps rendering.
 */
async function aux<T>(remote: () => Promise<T>, local: () => T): Promise<T> {
  if (demoMode || !probed) return local();
  try {
    return await remote();
  } catch {
    return local();
  }
}

export const dataSource = {
  // ---- Core (backend source of truth) ----
  getMetrics: (): Promise<StoreMetrics[]> =>
    core(() => backend.getMetrics(), () => engine.getAllMetrics()),

  getStoreMetrics: (id: string): Promise<StoreMetrics | null> =>
    core(
      () => backend.getStoreMetrics(id),
      () => engine.getStoreMetrics(id),
    ),

  getFunnel: (storeId?: string): Promise<FunnelStage[]> =>
    core(() => backend.getFunnel(storeId), () => engine.getFunnel(storeId)),

  getHeatmap: (storeId?: string): Promise<ZoneHeat[]> =>
    core(() => backend.getHeatmap(storeId), () => engine.getHeatmap(storeId)),

  getAnomalies: (storeId?: string): Promise<Anomaly[]> =>
    core(
      () => backend.getAnomalies(storeId),
      () => engine.getAnomalies(storeId),
    ),

  getHealth: (): Promise<SystemHealth> =>
    core(() => backend.health(), () => engine.getHealth()),

  ingestEvents: (events: StoreEvent[]): Promise<{ ingested: number }> =>
    core(
      () => backend.ingestEvents(events),
      () => ({ ingested: 0 }),
    ),

  acknowledgeAnomaly: (id: string): Promise<void> =>
    aux(
      () => backend.acknowledgeAnomaly(id),
      () => engine.acknowledgeAnomaly(id),
    ),

  acknowledgeAll: (): Promise<void> =>
    aux(
      () => backend.acknowledgeAll(),
      () => engine.acknowledgeAll(),
    ),

  // ---- Auxiliary (presentation visuals) ----
  getEvents: (storeId?: string): Promise<StoreEvent[]> =>
    aux(() => backend.getEvents(storeId), () => engine.getEvents(storeId)),

  getStoreSeries: (id: string): Promise<TimePoint[]> =>
    aux(() => backend.getStoreSeries(id), () => engine.getStoreSeries(id)),

  getAggregatedSeries: (): Promise<TimePoint[]> =>
    aux(
      () => backend.getAggregatedSeries(),
      () => engine.getAggregatedSeries(),
    ),

  getFleetSummary: (): Promise<FleetSummary> =>
    aux(() => backend.getFleetSummary(), () => engine.getFleetSummary()),

  getCameraFeeds: (): Promise<CameraFeed[]> =>
    aux(() => backend.getCameraFeeds(), () => engine.getCameraFeeds()),

  getAggregatedSparkline: (
    key: SparkKey,
  ): Promise<{ i: number; v: number }[]> =>
    Promise.resolve(engine.getAggregatedSparkline(key)),
};
