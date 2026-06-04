import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import type { Severity } from "../../lib/types";

type Tone = "low" | "medium" | "critical" | "success" | "info" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  low: "bg-info-soft text-info",
  info: "bg-info-soft text-info",
  medium: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  critical: "bg-critical-soft text-critical",
  neutral: "bg-zinc-100 text-text-secondary",
};

interface PillProps {
  tone: Tone;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusPill({ tone, children, pulse, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {pulse && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot"
        />
      )}
      {children}
    </span>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  const tone: Tone =
    severity === "CRITICAL" ? "critical" : severity === "MEDIUM" ? "medium" : "low";
  return (
    <StatusPill tone={tone} pulse={severity === "CRITICAL"}>
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </StatusPill>
  );
}
