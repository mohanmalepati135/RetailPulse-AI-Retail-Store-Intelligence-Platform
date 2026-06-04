// Real backend API client (Axios). This is the source of truth.
// Base URL is environment-driven — never hardcoded.

import axios, { type AxiosInstance } from "axios";
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

// ---- Purplle challenge response contracts (strong typing, no `any`) ----
export type MetricResponse = StoreMetrics;
export type FunnelResponse = FunnelStage;
export type HeatmapResponse = ZoneHeat;
export type AnomalyResponse = Anomaly;
export type HealthResponse = SystemHealth;
export type EventResponse = StoreEvent;

export interface IngestResult {
  ingested: number;
}

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:8000";

// A short timeout lets the UI fall back to demo mode quickly when the backend
// is unreachable, rather than hanging on a long network wait.
const REQUEST_TIMEOUT_MS = 4000;

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await client.get<T>(url, { params });
  return data;
}

export const backend = {
  baseUrl: BASE_URL,

  health: () => get<HealthResponse>("/health"),

  getMetrics: () => get<MetricResponse[]>("/metrics"),

  getStoreMetrics: (storeId: string) =>
    get<MetricResponse>(`/stores/${storeId}/metrics`),

  getFunnel: (storeId?: string) =>
    storeId
      ? get<FunnelResponse[]>(`/stores/${storeId}/funnel`)
      : get<FunnelResponse[]>("/analytics/funnel"),

  getHeatmap: (storeId?: string) =>
    storeId
      ? get<HeatmapResponse[]>(`/stores/${storeId}/heatmap`)
      : get<HeatmapResponse[]>("/analytics/heatmap"),

  getAnomalies: (storeId?: string) =>
    storeId
      ? get<AnomalyResponse[]>(`/stores/${storeId}/anomalies`)
      : get<AnomalyResponse[]>("/analytics/anomalies"),

  getEvents: (storeId?: string) =>
    get<EventResponse[]>("/events", storeId ? { store_id: storeId } : undefined),

  // Auxiliary presentation endpoints (optional on the backend).
  getStoreSeries: (storeId: string) =>
    get<TimePoint[]>(`/stores/${storeId}/series`),
  getAggregatedSeries: () => get<TimePoint[]>("/metrics/series"),
  getFleetSummary: () => get<FleetSummary>("/fleet/summary"),
  getCameraFeeds: () => get<CameraFeed[]>("/cameras"),

  ingestEvents: (events: StoreEvent[]) =>
    client
      .post<IngestResult>("/events/ingest", { events })
      .then((r) => r.data),

  acknowledgeAnomaly: (id: string) =>
    client.post(`/anomalies/${id}/acknowledge`).then(() => undefined),
  acknowledgeAll: () =>
    client.post(`/anomalies/acknowledge-all`).then(() => undefined),
};
