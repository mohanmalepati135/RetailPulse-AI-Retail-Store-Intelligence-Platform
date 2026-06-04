import { Camera, CameraOff } from "lucide-react";
import { useCameraFeeds } from "../hooks/queries";
import { Card, CardHeader } from "./ui/Card";
import { AsyncSection } from "./ui/AsyncSection";
import { StatusPill } from "./ui/StatusPill";
import { Skeleton } from "./ui/States";
import type { CameraFeed } from "../lib/types";

function feedTone(status: CameraFeed["status"]) {
  return status === "healthy"
    ? "success"
    : status === "warning"
      ? "medium"
      : "critical";
}

function feedLabel(status: CameraFeed["status"]) {
  return status === "healthy"
    ? "Healthy"
    : status === "warning"
      ? "Warning"
      : "Offline";
}

interface CameraHealthPanelProps {
  storeId?: string;
  limit?: number;
}

export function CameraHealthPanel({ storeId, limit = 7 }: CameraHealthPanelProps) {
  const feeds = useCameraFeeds();

  const filtered = (feeds.data ?? [])
    .filter((f) => (storeId ? f.store_id === storeId : true))
    .slice(0, limit);

  const online = (feeds.data ?? []).filter((f) => f.status !== "offline").length;
  const total = (feeds.data ?? []).length;

  return (
    <Card>
      <CardHeader
        title="Camera feed status"
        description="Live health across the camera fleet"
        action={
          <span className="text-[12px] font-medium text-text-secondary">
            {online}/{total} online
          </span>
        }
      />
      <div className="divide-y divide-border">
        <AsyncSection
          loading={feeds.loading}
          error={feeds.error}
          data={filtered}
          isEmpty={(d) => d.length === 0}
          onRetry={feeds.refetch}
          emptyLabel="No camera feeds connected"
          emptyIcon={CameraOff}
          skeleton={<Skeleton className="m-5 h-40" />}
        >
          {(data) =>
            data.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50/60"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    f.status === "offline"
                      ? "bg-critical-soft text-critical"
                      : "bg-zinc-100 text-text-secondary"
                  }`}
                >
                  {f.status === "offline" ? (
                    <CameraOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Camera className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-text-primary">
                    {f.label}
                  </div>
                  <div className="truncate text-[12px] text-text-muted">
                    {f.store_name}
                    {f.status === "offline"
                      ? ` · stale ${f.last_frame_seconds}s`
                      : ` · ${f.latency_ms}ms · ${f.fps}fps`}
                  </div>
                </div>
                <StatusPill
                  tone={feedTone(f.status)}
                  pulse={f.status !== "healthy"}
                >
                  {feedLabel(f.status)}
                </StatusPill>
              </div>
            ))
          }
        </AsyncSection>
      </div>
    </Card>
  );
}
