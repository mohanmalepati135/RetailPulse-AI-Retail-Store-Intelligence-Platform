import { Activity, Cpu, Database, Gauge, Radio, Server } from "lucide-react";
import { useHealth } from "../hooks/queries";
import { PageHeader } from "../components/layout/AppLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { AsyncSection } from "../components/ui/AsyncSection";
import { StatusPill } from "../components/ui/StatusPill";
import { Skeleton } from "../components/ui/States";
import { formatNumber, formatUptime } from "../lib/format";
import type { HealthComponent } from "../lib/types";

function componentIcon(name: string) {
  if (name.includes("API")) return Server;
  if (name.includes("Database")) return Database;
  if (name.includes("Pipeline")) return Cpu;
  if (name.includes("WebSocket")) return Radio;
  return Activity;
}

function statusTone(status: HealthComponent["status"]) {
  return status === "healthy"
    ? "success"
    : status === "degraded"
      ? "medium"
      : "critical";
}

export function SystemHealth() {
  const health = useHealth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System health"
        description="API, database, pipeline, and camera fleet status."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Uptime"
          value={health.data?.uptime_seconds ?? 0}
          format={(v) => formatUptime(Math.round(v))}
          icon={Gauge}
        />
        <MetricCard
          label="Events ingested"
          value={health.data?.events_ingested ?? 0}
          format={formatNumber}
          icon={Activity}
        />
        <MetricCard
          label="Events / min"
          value={health.data?.events_per_minute ?? 0}
          icon={Radio}
        />
        <MetricCard
          label="Pipeline FPS"
          value={health.data?.pipeline_fps ?? 0}
          format={(v) => v.toFixed(1)}
          icon={Cpu}
        />
      </div>

      <Card>
        <CardHeader
          title="Components"
          description="Live status of each subsystem"
        />
        <div className="divide-y divide-border">
          <AsyncSection
            loading={health.loading}
            error={health.error}
            data={health.data}
            onRetry={health.refetch}
            emptyLabel="Health data unavailable"
            skeleton={<Skeleton className="m-5 h-48" />}
          >
            {(data) =>
              data.components.map((c) => {
                const Icon = componentIcon(c.name);
                return (
                  <div
                    key={c.name}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-text-secondary">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-text-primary">{c.name}</div>
                      <div className="truncate text-[13px] text-text-secondary">
                        {c.detail}
                      </div>
                    </div>
                    <div className="hidden text-right text-[13px] text-text-secondary sm:block">
                      {c.latency_ms} ms
                    </div>
                    <StatusPill
                      tone={statusTone(c.status)}
                      pulse={c.status !== "healthy"}
                    >
                      {c.status}
                    </StatusPill>
                  </div>
                );
              })
            }
          </AsyncSection>
        </div>
      </Card>
    </div>
  );
}
