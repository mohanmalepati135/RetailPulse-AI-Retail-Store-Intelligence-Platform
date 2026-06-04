// API client abstraction. All network access flows through here so components
// never call the engine/fetch directly. Each method mirrors a REST endpoint.

import { engine } from "./mockEngine";
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
} from "./types";

type SparkKey = "visitors" | "conversions" | "queue";

const LATENCY_MS = 220;

// Simulate network latency + the small chance of a transient error so the UI's
// error states are exercised. Set FAILURE_RATE to 0 for deterministic demos.
const FAILURE_RATE = 0;

function withLatency<T>(producer: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < FAILURE_RATE) {
        reject(new Error("Upstream service unavailable"));
        return;
      }
      try {
        resolve(producer());
      } catch (err) {
        reject(err);
      }
    }, LATENCY_MS);
  });
}

export const api = {
  getMetrics: () => withLatency<StoreMetrics[]>(() => engine.getAllMetrics()),
  getStore: (id: string) =>
    withLatency<StoreMetrics | null>(() => engine.getStoreMetrics(id)),
  getStoreSeries: (id: string) =>
    withLatency<TimePoint[]>(() => engine.getStoreSeries(id)),
  getAggregatedSeries: () =>
    withLatency<TimePoint[]>(() => engine.getAggregatedSeries()),
  getEvents: (storeId?: string) =>
    withLatency<StoreEvent[]>(() => engine.getEvents(storeId)),
  getFunnel: (storeId?: string) =>
    withLatency<FunnelStage[]>(() => engine.getFunnel(storeId)),
  getHeatmap: (storeId?: string) =>
    withLatency<ZoneHeat[]>(() => engine.getHeatmap(storeId)),
  getAnomalies: (storeId?: string) =>
    withLatency<Anomaly[]>(() => engine.getAnomalies(storeId)),
  getHealth: () => withLatency<SystemHealth>(() => engine.getHealth()),
  getCameraFeeds: () =>
    withLatency<CameraFeed[]>(() => engine.getCameraFeeds()),
  getFleetSummary: () =>
    withLatency<FleetSummary>(() => engine.getFleetSummary()),
  getAggregatedSparkline: (key: SparkKey) =>
    withLatency<{ i: number; v: number }[]>(() =>
      engine.getAggregatedSparkline(key),
    ),
  acknowledgeAnomaly: (id: string) =>
    withLatency<void>(() => engine.acknowledgeAnomaly(id)),
  acknowledgeAll: () => withLatency<void>(() => engine.acknowledgeAll()),
};

export const liveRelay = {
  subscribe: (cb: () => void) => engine.subscribe(cb),
};
