import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  useAggregatedSeries,
  useAnomalies,
  useMetrics,
  useSparkline,
} from "../hooks/queries";
import { Hero } from "../components/Hero";
import { CameraHealthPanel } from "../components/CameraHealthPanel";
import { MetricCard } from "../components/ui/MetricCard";
import { Card, CardHeader } from "../components/ui/Card";
import { AsyncSection } from "../components/ui/AsyncSection";
import { TrendChart } from "../components/charts/TrendChart";
import { CHART_COLORS } from "../components/charts/ChartTooltip";
import { AnomalyItem } from "../components/AnomalyItem";
import { StatusPill } from "../components/ui/StatusPill";
import { Skeleton } from "../components/ui/States";
import {
  formatCurrency,
  formatDuration,
  formatPercent,
} from "../lib/format";
import type { StoreMetrics } from "../lib/types";

function statusTone(status: StoreMetrics["status"]) {
  return status === "online"
    ? "success"
    : status === "degraded"
      ? "medium"
      : "critical";
}

export function Dashboard() {
  const navigate = useNavigate();
  const metrics = useMetrics();
  const series = useAggregatedSeries();
  const anomalies = useAnomalies();
  const sparkVisitors = useSparkline("visitors");
  const sparkConv = useSparkline("conversions");
  const sparkQueue = useSparkline("queue");

  const summary = (metrics.data ?? []).reduce(
    (acc, s) => {
      acc.visitors += s.visitor_count;
      acc.active += s.active_visitors;
      acc.revenue += s.revenue;
      acc.conv += s.conversion_rate;
      acc.dwell += s.avg_dwell_seconds;
      acc.queue += s.queue_depth;
      return acc;
    },
    { visitors: 0, active: 0, revenue: 0, conv: 0, dwell: 0, queue: 0 },
  );
  const n = (metrics.data ?? []).length || 1;
  const openAnomalies = (anomalies.data ?? []).filter((a) => !a.acknowledged);

  return (
    <div className="space-y-6">
      <Hero />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          index={0}
          label="Visitors today"
          value={summary.visitors}
          icon={Users}
          trend={6.4}
          hint="vs yesterday"
          accent="#6366f1"
          spark={sparkVisitors.data ?? undefined}
        />
        <MetricCard
          index={1}
          label="Conversion rate"
          value={summary.conv / n}
          format={(v) => formatPercent(v)}
          icon={TrendingUp}
          trend={2.1}
          hint="across stores"
          accent="#2563eb"
          spark={sparkConv.data ?? undefined}
        />
        <MetricCard
          index={2}
          label="Queue depth"
          value={summary.queue}
          icon={Users}
          trend={-3.5}
          hint="people waiting"
          accent="#f59e0b"
          spark={sparkQueue.data ?? undefined}
        />
        <MetricCard
          index={3}
          label="Avg dwell time"
          value={summary.dwell / n}
          format={(v) => formatDuration(v)}
          icon={Timer}
          trend={-1.3}
          hint="per visitor"
          accent="#8b5cf6"
          spark={sparkVisitors.data ?? undefined}
        />
        <MetricCard
          index={4}
          label="Revenue estimate"
          value={summary.revenue}
          format={formatCurrency}
          icon={DollarSign}
          trend={4.8}
          hint="today"
          accent="#16a34a"
          spark={sparkConv.data ?? undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Store activity"
            description="Visitors and conversions by hour"
            action={
              <StatusPill tone="neutral">
                <Activity className="h-3 w-3" aria-hidden /> Live
              </StatusPill>
            }
          />
          <div className="p-5">
            <AsyncSection
              loading={series.loading}
              error={series.error}
              data={series.data}
              isEmpty={(d) => d.length === 0}
              onRetry={series.refetch}
              emptyLabel="No live data yet"
              skeleton={<Skeleton className="h-[280px] w-full" />}
            >
              {(data) => (
                <TrendChart
                  data={data}
                  xKey="time"
                  series={[
                    { key: "visitors", color: CHART_COLORS.brand, label: "Visitors" },
                    {
                      key: "conversions",
                      color: CHART_COLORS.success,
                      label: "Conversions",
                    },
                  ]}
                />
              )}
            </AsyncSection>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Anomaly feed"
            description={`${openAnomalies.length} open`}
            action={
              <button
                onClick={() => navigate("/anomalies")}
                className="text-[13px] font-medium text-brand hover:underline"
              >
                View all
              </button>
            }
          />
          <div className="max-h-[280px] divide-y divide-border overflow-y-auto">
            <AsyncSection
              loading={anomalies.loading}
              error={anomalies.error}
              data={anomalies.data}
              isEmpty={(d) => d.length === 0}
              onRetry={anomalies.refetch}
              emptyLabel="No anomalies detected"
              emptyIcon={AlertTriangle}
              skeleton={<Skeleton className="m-5 h-40" />}
            >
              {(data) =>
                data.slice(0, 8).map((a) => <AnomalyItem key={a.id} anomaly={a} />)
              }
            </AsyncSection>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Stores"
          description="Click a store to open its detail view"
        />
        <AsyncSection
          loading={metrics.loading}
          error={metrics.error}
          data={metrics.data}
          isEmpty={(d) => d.length === 0}
          onRetry={metrics.refetch}
          emptyLabel="No stores connected"
          skeleton={<Skeleton className="m-5 h-48" />}
        >
          {(data) => (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide">
                      Store
                    </th>
                    <th className="px-5 py-2.5 text-[12px] font-medium uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-5 py-2.5 text-right text-[12px] font-medium uppercase tracking-wide">
                      Active
                    </th>
                    <th className="px-5 py-2.5 text-right text-[12px] font-medium uppercase tracking-wide">
                      Conversion
                    </th>
                    <th className="hidden px-5 py-2.5 text-right text-[12px] font-medium uppercase tracking-wide sm:table-cell">
                      Queue
                    </th>
                    <th className="hidden px-5 py-2.5 text-right text-[12px] font-medium uppercase tracking-wide sm:table-cell">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr
                      key={s.store_id}
                      onClick={() => navigate(`/store/${s.store_id}`)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-zinc-50"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-text-primary">
                          {s.store_name}
                        </div>
                        <div className="text-[12px] text-text-secondary">
                          {s.store_id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill
                          tone={statusTone(s.status)}
                          pulse={s.status !== "online"}
                        >
                          {s.status}
                        </StatusPill>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {s.active_visitors}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {formatPercent(s.conversion_rate)}
                      </td>
                      <td className="hidden px-5 py-3 text-right tabular-nums sm:table-cell">
                        {s.queue_depth}
                      </td>
                      <td className="hidden px-5 py-3 text-right tabular-nums sm:table-cell">
                        {formatCurrency(s.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncSection>
      </Card>
      <CameraHealthPanel limit={6} />
      </div>
    </div>
  );
}
