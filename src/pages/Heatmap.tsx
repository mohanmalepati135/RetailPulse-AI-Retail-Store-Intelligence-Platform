import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import { useHeatmap } from "../hooks/queries";
import { PageHeader } from "../components/layout/AppLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { AsyncSection } from "../components/ui/AsyncSection";
import { StoreSelect } from "../components/StoreSelect";
import { BarSeriesChart } from "../components/charts/BarSeriesChart";
import { CHART_COLORS } from "../components/charts/ChartTooltip";
import { Skeleton } from "../components/ui/States";
import { StoreMap } from "../components/StoreMap";
import { formatPercent } from "../lib/format";

export function Heatmap() {
  const [storeId, setStoreId] = useState("");
  const heatmap = useHeatmap(storeId || undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retail store intelligence map"
        description="Live floor-plan view of where visitors engage and dwell."
        action={<StoreSelect value={storeId} onChange={setStoreId} />}
      />

      <Card>
        <CardHeader
          title="Store layout · engagement intensity"
          description="Hover a zone for dwell and conversion detail"
        />
        <div className="p-5">
          <AsyncSection
            loading={heatmap.loading}
            error={heatmap.error}
            data={heatmap.data}
            isEmpty={(d) => d.length === 0}
            onRetry={heatmap.refetch}
            emptyLabel="No zone data yet"
            emptyIcon={Grid3x3}
            skeleton={<Skeleton className="h-80 w-full" />}
          >
            {(data) => <StoreMap data={data} />}
          </AsyncSection>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Visitors by zone" description="Volume comparison" />
          <div className="p-5">
            <AsyncSection
              loading={heatmap.loading}
              error={heatmap.error}
              data={heatmap.data}
              isEmpty={(d) => d.length === 0}
              onRetry={heatmap.refetch}
              skeleton={<Skeleton className="h-64 w-full" />}
            >
              {(data) => (
                <BarSeriesChart
                  data={data}
                  xKey="zone_name"
                  barKey="visitors"
                  label="Visitors"
                  layout="vertical"
                  color={CHART_COLORS.brand}
                  height={260}
                />
              )}
            </AsyncSection>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Conversion contribution"
            description="Share of conversions attributed to each zone"
          />
          <div className="p-5">
            <AsyncSection
              loading={heatmap.loading}
              error={heatmap.error}
              data={heatmap.data}
              isEmpty={(d) => d.length === 0}
              onRetry={heatmap.refetch}
              skeleton={<Skeleton className="h-64 w-full" />}
            >
              {(data) => (
                <div className="space-y-3">
                  {[...data]
                    .sort(
                      (a, b) =>
                        b.conversion_contribution - a.conversion_contribution,
                    )
                    .map((z) => (
                      <div key={z.zone_id}>
                        <div className="mb-1 flex justify-between text-[13px]">
                          <span className="text-text-primary">{z.zone_name}</span>
                          <span className="tabular-nums text-text-secondary">
                            {formatPercent(z.conversion_contribution, 0)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{
                              width: `${z.conversion_contribution * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </AsyncSection>
          </div>
        </Card>
      </div>
    </div>
  );
}
