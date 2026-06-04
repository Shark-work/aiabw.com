"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Ga4TrendPoint } from "@/lib/ga4-reporting";

type Ga4TrendChartProps = {
  data: Ga4TrendPoint[];
};

export function Ga4TrendChart({ data }: Ga4TrendChartProps) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">暂无 GA4 趋势数据</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(0,245,255,0.2)",
              borderRadius: 12,
              color: "#e2e8f0",
            }}
          />
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="sessions"
            name="访问量"
            stroke="#00f5ff"
            strokeWidth={2}
            dot={{ r: 3, fill: "#00f5ff" }}
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            name="浏览量"
            stroke="#a855f7"
            strokeWidth={2}
            dot={{ r: 3, fill: "#a855f7" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
