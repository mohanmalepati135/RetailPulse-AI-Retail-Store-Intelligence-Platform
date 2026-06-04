// Domain types mirroring the backend schema (Document 05).

export type EventType =
  | "ENTRY"
  | "EXIT"
  | "ZONE_ENTER"
  | "ZONE_EXIT"
  | "DWELL"
  | "QUEUE_SPIKE";

export type Severity = "LOW" | "MEDIUM" | "CRITICAL";

export interface StoreEvent {
  event_id: string;
  store_id: string;
  camera_id: string;
  visitor_id: string;
  event_type: EventType;
  timestamp: string;
  zone_id: string | null;
  dwell_ms: number | null;
  is_staff: boolean;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface Session {
  visitor_id: string;
  store_id: string;
  entry_time: string;
  exit_time: string | null;
  is_converted: boolean;
  purchase_amount: number | null;
}

export interface StoreMetrics {
  store_id: string;
  store_name: string;
  visitor_count: number;
  active_visitors: number;
  conversion_rate: number;
  avg_dwell_seconds: number;
  queue_depth: number;
  revenue: number;
  trend: number; // percentage change vs previous window
  status: "online" | "degraded" | "offline";
}

export interface Store {
  id: string;
  name: string;
  region: string;
  cameras: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  rate: number; // conversion from previous stage
}

export interface ZoneHeat {
  zone_id: string;
  zone_name: string;
  visitors: number;
  avg_dwell_seconds: number;
  conversion_contribution: number;
}

export interface Anomaly {
  id: string;
  store_id: string;
  store_name: string;
  type: string;
  severity: Severity;
  message: string;
  explanation: string;
  suggested_action: string;
  confidence: number;
  metric_change: string;
  zone_id: string | null;
  timestamp: string;
  acknowledged: boolean;
}

export interface HealthComponent {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  detail: string;
}

export interface SystemHealth {
  uptime_seconds: number;
  components: HealthComponent[];
  events_ingested: number;
  events_per_minute: number;
  pipeline_fps: number;
}

export interface TimePoint {
  time: string;
  visitors: number;
  conversions: number;
  queue: number;
}

export interface CameraFeed {
  id: string;
  label: string;
  store_id: string;
  store_name: string;
  status: "healthy" | "warning" | "offline";
  latency_ms: number;
  fps: number;
  last_frame_seconds: number;
}

export interface FleetSummary {
  stores_active: number;
  cameras_online: number;
  cameras_total: number;
  feed_health: number; // 0..1
}
