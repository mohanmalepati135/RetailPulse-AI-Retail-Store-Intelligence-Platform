import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltip } from "./ChartTooltip";

interface SeriesDef {
  key: string;
  color: string;
  label: string;
}

interface TrendChartProps {
  // Chart rows are heterogeneous by design; recharts consumes loosely-typed rows.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  series: SeriesDef[];
  height?: number;
  valueFormatter?: (v: number, name: string) => string;
}

const AXIS_STYLE = { fontSize: 12, fill: CHART_COLORS.axis };

export function TrendChart({
  data,
  xKey,
  series,
  height = 280,
  valueFormatter,
}: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="0" />
        <XAxis
          dataKey={xKey}
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          dy={6}
        />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          content={<ChartTooltip formatter={valueFormatter} />}
          cursor={{ stroke: "#cbd5e1", strokeDasharray: "4 4" }}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            animationDuration={600}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
