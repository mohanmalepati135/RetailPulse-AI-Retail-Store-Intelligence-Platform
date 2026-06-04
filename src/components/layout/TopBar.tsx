import { useEffect, useMemo, useState } from "react";
import { Wifi } from "lucide-react";
import { useMetrics } from "../../hooks/queries";
import { AnimatedNumber } from "../ui/AnimatedNumber";
import { formatCurrency, formatPercent } from "../../lib/format";
import { Skeleton } from "../ui/States";

interface SummaryStat {
  label: string;
  value: number;
  format: (n: number) => string;
}

function useUpdatedAgo(trigger: unknown) {
  const [since, setSince] = useState(Date.now());
  useEffect(() => setSince(Date.now()), [trigger]);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.floor((Date.now() - since) / 1000);
  return secs < 2 ? "just now" : `${secs}s ago`;
}

export function TopBar() {
  const { data, loading } = useMetrics();
  const updated = useUpdatedAgo(data);

  const stats: SummaryStat[] = useMemo(() => {
    const m = data ?? [];
    const totalVisitors = m.reduce((a, s) => a + s.visitor_count, 0);
    const active = m.reduce((a, s) => a + s.active_visitors, 0);
    const revenue = m.reduce((a, s) => a + s.revenue, 0);
    const queue = m.reduce((a, s) => a + s.queue_depth, 0);
    const conv = m.length
      ? m.reduce((a, s) => a + s.conversion_rate, 0) / m.length
      : 0;
    return [
      { label: "Visitors today", value: totalVisitors, format: (n) => String(Math.round(n)) },
      { label: "Active now", value: active, format: (n) => String(Math.round(n)) },
      { label: "Avg conversion", value: conv, format: (n) => formatPercent(n) },
      { label: "Revenue", value: revenue, format: formatCurrency },
      { label: "Queue depth", value: queue, format: (n) => String(Math.round(n)) },
    ];
  }, [data]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="flex items-center gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[12px] font-medium text-success">
            <span className="relative flex h-2 w-2 text-success">
              <span className="live-ring absolute inline-flex h-2 w-2 rounded-full" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live
          </span>
          <span className="hidden text-[12px] text-text-muted sm:inline">
            Updated {updated}
          </span>
        </div>

        <div className="flex flex-1 items-stretch overflow-x-auto">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex min-w-fit flex-col px-4 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <span className="label-caps whitespace-nowrap text-[10px]">
                {s.label}
              </span>
              <span className="mt-0.5 text-[18px] font-semibold leading-tight tracking-tight text-text-primary">
                {loading && !data ? (
                  <Skeleton className="h-5 w-14" />
                ) : (
                  <AnimatedNumber value={s.value} format={s.format} />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] text-text-muted lg:flex">
          <Wifi className="h-3.5 w-3.5 text-success" aria-hidden />
          WS streaming
        </div>
      </div>
    </header>
  );
}
