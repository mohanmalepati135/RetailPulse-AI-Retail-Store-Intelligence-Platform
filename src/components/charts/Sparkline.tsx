import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: { i: number; v: number }[];
  color?: string;
  height?: number;
}

/** Tiny inline trend chart for KPI cards. No axes, no tooltip — pure shape. */
export function Sparkline({ data, color = "#6366f1", height = 40 }: SparklineProps) {
  const id = `spark-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${id})`}
          dot={false}
          isAnimationActive
          animationDuration={500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
