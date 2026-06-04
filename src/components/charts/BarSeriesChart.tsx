import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, ChartTooltip } from "./ChartTooltip";

interface BarSeriesChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  barKey: string;
  label: string;
  color?: string;
  colorByIndex?: string[];
  height?: number;
  layout?: "horizontal" | "vertical";
  valueFormatter?: (v: number, name: string) => string;
}

const AXIS_STYLE = { fontSize: 12, fill: CHART_COLORS.axis };

export function BarSeriesChart({
  data,
  xKey,
  barKey,
  label,
  color = CHART_COLORS.brand,
  colorByIndex,
  height = 280,
  layout = "horizontal",
  valueFormatter,
}: BarSeriesChartProps) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 12, left: vertical ? 8 : -12, bottom: 0 }}
      >
        <CartesianGrid
          stroke={CHART_COLORS.grid}
          vertical={vertical}
          horizontal={!vertical}
        />
        {vertical ? (
          <>
            <XAxis
              type="number"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={110}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={44}
            />
          </>
        )}
        <Tooltip
          content={<ChartTooltip formatter={valueFormatter} />}
          cursor={{ fill: CHART_COLORS.grid }}
        />
        <Bar dataKey={barKey} name={label} radius={4} maxBarSize={48}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={colorByIndex ? colorByIndex[i % colorByIndex.length] : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
