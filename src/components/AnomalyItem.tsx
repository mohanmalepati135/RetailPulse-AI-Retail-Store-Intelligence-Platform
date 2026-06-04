import { Check, Lightbulb, MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { SeverityPill } from "./ui/StatusPill";
import { timeAgo } from "../lib/format";
import { ZONES } from "../lib/constants";
import type { Anomaly } from "../lib/types";

interface AnomalyItemProps {
  anomaly: Anomaly;
  onAcknowledge?: (id: string) => void;
  expanded?: boolean;
}

export function AnomalyItem({ anomaly, onAcknowledge, expanded }: AnomalyItemProps) {
  const zoneName = anomaly.zone_id
    ? ZONES.find((z) => z.id === anomaly.zone_id)?.name
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`px-5 py-3.5 transition-colors hover:bg-zinc-50/60 ${
        anomaly.acknowledged ? "opacity-55" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityPill severity={anomaly.severity} />
            <span className="text-[14px] font-semibold text-text-primary">
              {anomaly.type}
            </span>
            <span className="text-[12px] text-text-secondary">
              · {anomaly.store_name}
            </span>
            {zoneName && (
              <span className="inline-flex items-center gap-0.5 text-[12px] text-text-secondary">
                <MapPin className="h-3 w-3" aria-hidden />
                {zoneName}
              </span>
            )}
            <span className="ml-auto text-[12px] text-text-muted">
              {timeAgo(anomaly.timestamp)}
            </span>
          </div>

          <p className="mt-1.5 text-[13px] text-text-secondary">
            {anomaly.metric_change ?? anomaly.message}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
              <TrendingUp className="h-3 w-3" aria-hidden />
              {Math.round((anomaly.confidence ?? 0.9) * 100)}% confidence
            </span>
          </div>

          {expanded && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-brand-soft bg-brand-soft/60 px-3 py-2">
              <Lightbulb
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand"
                aria-hidden
              />
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-brand-ink">
                  Suggested action
                </span>
                <p className="mt-0.5 text-[13px] text-text-primary">
                  {anomaly.suggested_action}
                </p>
              </div>
            </div>
          )}
        </div>

        {onAcknowledge && (
          <div className="shrink-0 self-center">
            {anomaly.acknowledged ? (
              <span className="inline-flex items-center gap-1 text-[12px] text-success">
                <Check className="h-3.5 w-3.5" aria-hidden /> Ack
              </span>
            ) : (
              <button
                onClick={() => onAcknowledge(anomaly.id)}
                className="rounded-lg border border-border px-2.5 py-1 text-[12px] font-medium text-text-primary transition-colors hover:bg-[#f5f7ff]"
              >
                Acknowledge
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
