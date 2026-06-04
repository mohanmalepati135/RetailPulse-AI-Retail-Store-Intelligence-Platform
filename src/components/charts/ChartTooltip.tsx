interface TooltipEntry {
  color?: string;
  name?: string | number;
  value?: number | string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}

/** Shared tooltip: white card, 1px border, shadow-sm, 13px text. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
      {label !== undefined && (
        <p className="mb-1 text-[12px] font-medium text-text-secondary">{label}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary capitalize">{entry.name}</span>
            <span className="ml-auto font-medium text-text-primary">
              {formatter
                ? formatter(Number(entry.value), String(entry.name))
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CHART_COLORS = {
  brand: "#6366f1",
  secondary: "#8b5cf6",
  info: "#2563eb",
  success: "#16a34a",
  warning: "#f59e0b",
  critical: "#dc2626",
  grid: "#f1f5f9",
  axis: "#9ca3af",
};
