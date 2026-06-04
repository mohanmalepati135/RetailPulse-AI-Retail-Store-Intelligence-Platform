import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "../charts/Sparkline";
import { cn } from "../../utils/cn";

interface MetricCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  trend?: number;
  icon?: LucideIcon;
  hint?: string;
  accent?: string;
  spark?: { i: number; v: number }[];
  index?: number;
}

export function MetricCard({
  label,
  value,
  format,
  trend,
  icon: Icon,
  hint,
  accent = "#6366f1",
  spark,
  index = 0,
}: MetricCardProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="p-5 pt-6">
        <div className="flex items-center justify-between">
          <span className="label-caps">{label}</span>
          {Icon && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-[40px] font-semibold leading-none tracking-tight text-text-primary">
            <AnimatedNumber value={value} format={format} />
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-[12px]">
          {typeof trend === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                positive
                  ? "bg-success-soft text-success"
                  : "bg-critical-soft text-critical",
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-text-muted">{hint}</span>}
        </div>

        {spark && spark.length > 0 && (
          <div className="-mx-1 mt-3 h-10 opacity-90">
            <Sparkline data={spark} color={accent} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
