import { useState } from "react";
import { motion } from "framer-motion";
import { ZONE_LAYOUT, HIGH_DWELL_SECONDS } from "../lib/constants";
import { formatDuration, formatPercent } from "../lib/format";
import type { ZoneHeat } from "../lib/types";

function intensity(value: number, max: number) {
  const t = max ? Math.min(1, value / max) : 0;
  // indigo ramp: soft (#eef2ff) → strong (#4338ca)
  const stops = [
    [238, 242, 255],
    [199, 210, 254],
    [129, 140, 248],
    [99, 102, 241],
    [67, 56, 202],
  ];
  const pos = t * (stops.length - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return { color: `rgb(${c[0]}, ${c[1]}, ${c[2]})`, t };
}

export function StoreMap({ data }: { data: ZoneHeat[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...data.map((z) => z.visitors), 1);

  return (
    <div className="relative">
      <div
        className="relative grid gap-2 rounded-2xl border border-border bg-[#fbfcfe] p-3"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gridTemplateRows: "repeat(4, 84px)",
        }}
      >
        {data.map((z) => {
          const layout = ZONE_LAYOUT[z.zone_id];
          if (!layout) return null;
          const { color, t } = intensity(z.visitors, max);
          const light = t < 0.5;
          const highDwell = z.avg_dwell_seconds > HIGH_DWELL_SECONDS;
          return (
            <motion.div
              key={z.zone_id}
              onMouseEnter={() => setHover(z.zone_id)}
              onMouseLeave={() => setHover(null)}
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.15 }}
              className="relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl p-3 ring-1 ring-black/5"
              style={{
                gridColumn: `${layout.col} / span ${layout.w}`,
                gridRow: `${layout.row} / span ${layout.h}`,
                backgroundColor: color,
              }}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-[13px] font-semibold ${light ? "text-text-primary" : "text-white"}`}
                >
                  {z.zone_name}
                </span>
                {highDwell && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      light ? "bg-warning-soft text-warning" : "bg-white/20 text-white"
                    }`}
                  >
                    hot
                  </span>
                )}
              </div>
              <div>
                <div
                  className={`text-[20px] font-semibold leading-none ${light ? "text-text-primary" : "text-white"}`}
                >
                  {z.visitors}
                </div>
                <div
                  className={`mt-0.5 text-[11px] ${light ? "text-text-secondary" : "text-white/75"}`}
                >
                  visitors
                </div>
              </div>

              {hover === z.zone_id && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-2 right-2 z-10 w-40 rounded-lg border border-border bg-surface p-2.5 text-text-primary shadow-[var(--shadow-card-hover)]"
                >
                  <div className="text-[12px] font-semibold">{z.zone_name}</div>
                  <div className="mt-1 space-y-0.5 text-[11px] text-text-secondary">
                    <div className="flex justify-between gap-3">
                      <span>Visitors</span>
                      <span className="font-medium text-text-primary">
                        {z.visitors}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Avg dwell</span>
                      <span className="font-medium text-text-primary">
                        {formatDuration(z.avg_dwell_seconds)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Conv. share</span>
                      <span className="font-medium text-text-primary">
                        {formatPercent(z.conversion_contribution, 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
        <span>Low engagement</span>
        <div
          className="mx-3 h-2 flex-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #eef2ff, #c7d2fe, #818cf8, #6366f1, #4338ca)",
          }}
          aria-hidden
        />
        <span>High engagement</span>
      </div>
    </div>
  );
}
