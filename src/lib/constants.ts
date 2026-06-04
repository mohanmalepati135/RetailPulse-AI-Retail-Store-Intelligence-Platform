// Centralized configuration — no magic numbers scattered through the app.

import type { Store } from "./types";

export const APP_NAME = "RetailPulse AI";

export const STORES: Store[] = [
  { id: "STR-001", name: "Downtown Flagship", region: "Metro West", cameras: 6 },
  { id: "STR-002", name: "Riverside Mall", region: "Metro East", cameras: 4 },
  { id: "STR-003", name: "Airport Terminal 2", region: "North", cameras: 8 },
  { id: "STR-004", name: "Suburbia Plaza", region: "South", cameras: 3 },
  { id: "STR-005", name: "Harbor Outlet", region: "Coastal", cameras: 5 },
];

export const ZONES = [
  { id: "Z1", name: "Entry" },
  { id: "Z2", name: "Skincare" },
  { id: "Z3", name: "Makeup" },
  { id: "Z4", name: "Fragrance" },
  { id: "Z5", name: "Checkout" },
  { id: "Z6", name: "Fitting Rooms" },
];

// Floor-plan layout (grid units) used by the store intelligence map.
export const ZONE_LAYOUT: Record<
  string,
  { col: number; row: number; w: number; h: number }
> = {
  Z1: { col: 1, row: 1, w: 4, h: 1 },
  Z2: { col: 1, row: 2, w: 2, h: 2 },
  Z3: { col: 3, row: 2, w: 2, h: 1 },
  Z4: { col: 3, row: 3, w: 2, h: 1 },
  Z5: { col: 1, row: 4, w: 2, h: 1 },
  Z6: { col: 3, row: 4, w: 2, h: 1 },
};

export const FUNNEL_STAGES = [
  "Store entry",
  "Zone engagement",
  "Product interaction",
  "Queue / checkout",
  "Purchase",
] as const;

export const CAMERAS = ["CAM-A", "CAM-B", "CAM-C", "CAM-D"];

// Simulation cadence
export const LIVE_TICK_MS = 2000;
export const SKELETON_TIMEOUT_MS = 1500;

// Detection thresholds (mirrors pipeline config)
export const DETECTION_CONFIDENCE_THRESHOLD = 0.45;
export const QUEUE_SPIKE_THRESHOLD = 6;
export const HIGH_DWELL_SECONDS = 180;

export const SEVERITY_ORDER = { CRITICAL: 0, MEDIUM: 1, LOW: 2 } as const;

export const ANOMALY_TYPES = [
  "Queue spike",
  "Dwell anomaly",
  "Conversion drop",
  "Camera dropout",
  "Crowd density",
  "Abandoned zone",
];
