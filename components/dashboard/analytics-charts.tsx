"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface DayPoint {
  day: string;
  submissions: number;
  impressions: number;
}

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function DailyChart({ data, dataKey, color, label }: { data: DayPoint[]; dataKey: "submissions" | "impressions"; color: string; label: string }) {
  return (
    <div role="img" aria-label={`${label} per day, ${data.reduce((s, d) => s + d[dataKey], 0)} total`} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={fmt} stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(l) => fmt(String(l))}
            formatter={(v) => [v, label]}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)" }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
