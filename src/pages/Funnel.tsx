import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, TrendingDown } from "lucide-react";
import { useFunnel } from "../hooks/queries";
import { PageHeader } from "../components/layout/AppLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { AsyncSection } from "../components/ui/AsyncSection";
import { StoreSelect } from "../components/StoreSelect";
import { Skeleton } from "../components/ui/States";
import { formatNumber, formatPercent } from "../lib/format";
import { CHART_COLORS } from "../components/charts/ChartTooltip";
import type { FunnelStage } from "../lib/types";

const STAGE_COLORS = [
  CHART_COLORS.brand,
  "#8b5cf6",
  CHART_COLORS.info,
  CHART_COLORS.warning,
  CHART_COLORS.success,
];

function FunnelBars({ data }: { data: FunnelStage[] }) {
  const max = data[0]?.count ?? 1;
  return (
    <div className="space-y-3">
      {data.map((stage, i) => {
        const width = (stage.count / max) * 100;
        const dropoff = i > 0 ? 1 - stage.rate : 0;
        return (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className="font-medium text-text-primary">{stage.stage}</span>
              <span className="text-text-secondary tabular-nums">
                {formatNumber(stage.count)}
                {i > 0 && (
                  <span className="ml-2 text-text-secondary">
                    {formatPercent(stage.rate, 0)} kept
                  </span>
                )}
              </span>
            </div>
            <div className="h-9 w-full overflow-hidden rounded-lg bg-zinc-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex h-full items-center rounded-lg px-3 text-[12px] font-medium text-white"
                style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
              >
                {width > 12 && formatPercent(stage.count / max, 0)}
              </motion.div>
            </div>
            {dropoff > 0.001 && (
              <div className="mt-1 flex items-center gap-1 text-[12px] text-critical">
                <TrendingDown className="h-3 w-3" aria-hidden />
                {formatPercent(dropoff, 0)} drop-off from previous stage
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Funnel() {
  const [storeId, setStoreId] = useState("");
  const funnel = useFunnel(storeId || undefined);

  const overall = funnel.data
    ? (funnel.data[funnel.data.length - 1].count / (funnel.data[0].count || 1))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversion funnel"
        description="Trace how visitors progress from entry to purchase."
        action={<StoreSelect value={storeId} onChange={setStoreId} />}
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Funnel stages"
            description="Visitor count and stage retention"
          />
          <div className="p-5">
            <AsyncSection
              loading={funnel.loading}
              error={funnel.error}
              data={funnel.data}
              isEmpty={(d) => d.length === 0}
              onRetry={funnel.refetch}
              emptyLabel="No funnel data yet"
              emptyIcon={Filter}
              skeleton={<Skeleton className="h-72 w-full" />}
            >
              {(data) => <FunnelBars data={data} />}
            </AsyncSection>
          </div>
        </Card>

        <Card>
          <CardHeader title="Summary" description="End-to-end performance" />
          <div className="space-y-4 p-5">
            <div>
              <span className="label-caps">Overall conversion</span>
              <div className="mt-1 text-[32px] font-medium text-text-primary">
                {formatPercent(overall)}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <span className="label-caps">Biggest drop-off</span>
              <AsyncSection
                loading={funnel.loading}
                error={funnel.error}
                data={funnel.data}
                onRetry={funnel.refetch}
                skeleton={<Skeleton className="mt-2 h-6 w-32" />}
              >
                {(data) => {
                  let worst = { stage: "—", loss: 0 };
                  data.forEach((s, i) => {
                    if (i > 0 && 1 - s.rate > worst.loss)
                      worst = { stage: s.stage, loss: 1 - s.rate };
                  });
                  return (
                    <div className="mt-1">
                      <div className="text-[18px] font-medium text-text-primary">
                        {worst.stage}
                      </div>
                      <div className="text-[13px] text-critical">
                        {formatPercent(worst.loss, 0)} of visitors lost here
                      </div>
                    </div>
                  );
                }}
              </AsyncSection>
            </div>
            <div className="rounded-lg bg-brand-soft p-3 text-[13px] text-text-secondary">
              Recommendation: investigate staffing and pricing at the worst-performing
              stage to recover lost conversions.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
