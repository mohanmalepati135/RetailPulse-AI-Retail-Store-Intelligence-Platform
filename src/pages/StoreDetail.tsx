import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CameraOff,
  DollarSign,
  ListChecks,
  Timer,
  Users,
  VideoOff,
} from "lucide-react";
import {
  useEvents,
  useHeatmap,
  useStoreMetrics,
  useStoreSeries,
} from "../hooks/queries";
import { PageHeader } from "../components/layout/AppLayout";
import { MetricCard } from "../components/ui/MetricCard";
import { Card, CardHeader } from "../components/ui/Card";
import { AsyncSection } from "../components/ui/AsyncSection";
import { TrendChart } from "../components/charts/TrendChart";
import { BarSeriesChart } from "../components/charts/BarSeriesChart";
import { CameraHealthPanel } from "../components/CameraHealthPanel";
import { CHART_COLORS } from "../components/charts/ChartTooltip";
import { StatusPill } from "../components/ui/StatusPill";
import { EmptyState, Skeleton } from "../components/ui/States";
import { STORES } from "../lib/constants";
import {
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTime,
} from "../lib/format";

export function StoreDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const store = STORES.find((s) => s.id === id);

  const metrics = useStoreMetrics(id);
  const series = useStoreSeries(id);
  const heatmap = useHeatmap(id);
  const events = useEvents(id);

  if (!store) {
    return (
      <Card>
        <EmptyState
          icon={VideoOff}
          label="Store disconnected — we couldn't find this store"
          actionLabel="Back to dashboard"
          onAction={() => navigate("/dashboard")}
        />
      </Card>
    );
  }

  const m = metrics.data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to dashboard
      </button>

      <PageHeader
        title={store.name}
        description={`${store.region} · ${store.cameras} cameras · ${store.id}`}
        action={
          m && (
            <StatusPill
              tone={
                m.status === "online"
                  ? "success"
                  : m.status === "degraded"
                    ? "medium"
                    : "critical"
              }
              pulse={m.status !== "online"}
            >
              {m.status}
            </StatusPill>
          )
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active visitors"
          value={m?.active_visitors ?? 0}
          icon={Users}
          trend={m?.trend}
        />
        <MetricCard
          label="Conversion rate"
          value={m?.conversion_rate ?? 0}
          format={(v) => formatPercent(v)}
          icon={ListChecks}
          trend={1.8}
        />
        <MetricCard
          label="Avg dwell"
          value={m?.avg_dwell_seconds ?? 0}
          format={(v) => formatDuration(v)}
          icon={Timer}
        />
        <MetricCard
          label="Revenue"
          value={m?.revenue ?? 0}
          format={formatCurrency}
          icon={DollarSign}
          trend={5.2}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Traffic & queue" description="Hourly breakdown" />
          <div className="p-5">
            <AsyncSection
              loading={series.loading}
              error={series.error}
              data={series.data}
              isEmpty={(d) => d.length === 0}
              onRetry={series.refetch}
              emptyLabel="Camera feed unavailable"
              emptyIcon={CameraOff}
              skeleton={<Skeleton className="h-[280px] w-full" />}
            >
              {(data) => (
                <TrendChart
                  data={data}
                  xKey="time"
                  series={[
                    { key: "visitors", color: CHART_COLORS.brand, label: "Visitors" },
                    { key: "queue", color: CHART_COLORS.warning, label: "Queue" },
                  ]}
                />
              )}
            </AsyncSection>
          </div>
        </Card>

        <Card>
          <CardHeader title="Zone dwell" description="Avg seconds per zone" />
          <div className="p-5">
            <AsyncSection
              loading={heatmap.loading}
              error={heatmap.error}
              data={heatmap.data}
              isEmpty={(d) => d.length === 0}
              onRetry={heatmap.refetch}
              skeleton={<Skeleton className="h-[280px] w-full" />}
            >
              {(data) => (
                <BarSeriesChart
                  data={data}
                  xKey="zone_name"
                  barKey="avg_dwell_seconds"
                  label="Avg dwell (s)"
                  layout="vertical"
                  color={CHART_COLORS.info}
                  height={280}
                />
              )}
            </AsyncSection>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Live event stream"
          description="Raw detections from the ingest API"
        />
        <div className="max-h-[360px] overflow-y-auto">
          <AsyncSection
            loading={events.loading}
            error={events.error}
            data={events.data}
            isEmpty={(d) => d.length === 0}
            onRetry={events.refetch}
            emptyLabel="No events yet — waiting for detections"
            skeleton={<Skeleton className="m-5 h-40" />}
          >
            {(data) => (
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-5 py-2 text-[11px] font-medium uppercase">Time</th>
                    <th className="px-5 py-2 text-[11px] font-medium uppercase">Event</th>
                    <th className="px-5 py-2 text-[11px] font-medium uppercase">Zone</th>
                    <th className="px-5 py-2 text-[11px] font-medium uppercase">Camera</th>
                    <th className="px-5 py-2 text-right text-[11px] font-medium uppercase">Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 30).map((e) => (
                    <tr key={e.event_id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2 tabular-nums text-text-secondary">
                        {formatTime(e.timestamp)}
                      </td>
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">
                            {e.event_type}
                          </span>
                          {e.is_staff && (
                            <StatusPill tone="neutral">staff</StatusPill>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2 text-text-secondary">
                        {e.zone_id ?? "—"}
                      </td>
                      <td className="px-5 py-2 text-text-secondary">{e.camera_id}</td>
                      <td className="px-5 py-2 text-right tabular-nums text-text-secondary">
                        {(e.confidence * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </AsyncSection>
        </div>
      </Card>
      <CameraHealthPanel storeId={id} limit={6} />
      </div>
    </div>
  );
}
