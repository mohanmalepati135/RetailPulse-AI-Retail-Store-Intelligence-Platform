import { useMemo, useState } from "react";
import { CheckCheck, ShieldCheck } from "lucide-react";
import { useAcknowledge, useAnomalies } from "../hooks/queries";
import { PageHeader } from "../components/layout/AppLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { AsyncSection } from "../components/ui/AsyncSection";
import { StoreSelect } from "../components/StoreSelect";
import { AnomalyItem } from "../components/AnomalyItem";
import { Skeleton } from "../components/ui/States";
import { cn } from "../utils/cn";
import { SEVERITY_ORDER } from "../lib/constants";
import type { Severity } from "../lib/types";

type Filter = "ALL" | Severity | "OPEN";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "CRITICAL", label: "Critical" },
  { key: "MEDIUM", label: "Medium" },
  { key: "LOW", label: "Low" },
];

export function Anomalies() {
  const [storeId, setStoreId] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const anomalies = useAnomalies(storeId || undefined);
  const { acknowledge, acknowledgeAll } = useAcknowledge();

  const filtered = useMemo(() => {
    const list = anomalies.data ?? [];
    return [...list]
      .filter((a) => {
        if (filter === "ALL") return true;
        if (filter === "OPEN") return !a.acknowledged;
        return a.severity === filter;
      })
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [anomalies.data, filter]);

  const counts = useMemo(() => {
    const list = anomalies.data ?? [];
    return {
      critical: list.filter((a) => a.severity === "CRITICAL" && !a.acknowledged)
        .length,
      open: list.filter((a) => !a.acknowledged).length,
    };
  }, [anomalies.data]);

  const handleAck = (id: string) => acknowledge(id);
  const handleAckAll = () => acknowledgeAll();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anomaly monitoring"
        description={`${counts.open} open · ${counts.critical} critical`}
        action={
          <div className="flex items-center gap-2">
            <StoreSelect value={storeId} onChange={setStoreId} />
            <button
              onClick={handleAckAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-text-primary transition-colors hover:bg-zinc-100"
            >
              <CheckCheck className="h-4 w-4" aria-hidden /> Acknowledge all
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
              filter === f.key
                ? "bg-brand-soft text-brand"
                : "border border-border bg-surface text-text-secondary hover:bg-zinc-100",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Detected anomalies"
          description="Rule-based detection with severity levels"
        />
        <div className="divide-y divide-border">
          <AsyncSection
            loading={anomalies.loading}
            error={anomalies.error}
            data={filtered}
            isEmpty={(d) => d.length === 0}
            onRetry={anomalies.refetch}
            emptyLabel="No anomalies match this filter"
            emptyIcon={ShieldCheck}
            skeleton={<Skeleton className="m-5 h-64" />}
          >
            {(data) =>
              data.map((a) => (
                <AnomalyItem
                  key={a.id}
                  anomaly={a}
                  onAcknowledge={handleAck}
                  expanded
                />
              ))
            }
          </AsyncSection>
        </div>
      </Card>
    </div>
  );
}
