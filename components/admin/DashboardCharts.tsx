"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = { day: string; value: number };

type DashboardChartsProps = {
  newUsers: TrendPoint[];
  revenue: TrendPoint[];
  chats: TrendPoint[];
};

function ChartBlock({ title, data, color }: { title: string; data: TrendPoint[]; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 text-sm font-medium text-slate-200">{title}</div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} width={36} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(0,245,255,0.2)",
                borderRadius: 12,
                color: "#e2e8f0",
              }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardCharts({ newUsers, revenue, chats }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartBlock title="近 7 天新增用户" data={newUsers} color="#00f5ff" />
      <ChartBlock title="近 7 天收入 (USD)" data={revenue} color="#a855f7" />
      <ChartBlock title="近 7 天聊天次数" data={chats} color="#34d399" />
    </div>
  );
}
