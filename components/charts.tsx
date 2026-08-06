"use client";

import * as React from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Stats } from "@/lib/types";

const RATING_COLORS: Record<string, string> = {
  "Sangat Baik": "#10b981",
  Baik: "#6366f1",
  Cukup: "#f59e0b",
  Kurang: "#ef4444",
};

const BAGIAN_COLORS = ["#6366f1", "#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6"];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; payload?: { name?: string; rating?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">
        {label ?? payload[0]?.payload?.name ?? payload[0]?.payload?.rating ?? payload[0]?.name}
      </p>
      <p className="text-muted-foreground">{payload[0]?.value} submission</p>
    </div>
  );
}

export function SubmissionBarChart({ data }: { data: Stats["perBulan"] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={{ stroke: "currentColor", opacity: 0.2 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "currentColor", opacity: 0.06 }} />
          <Bar dataKey="jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RatingDonut({ data }: { data: Stats["perRating"] }) {
  return (
    <div className="flex h-56 items-center gap-4">
      <div className="h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="jumlah" nameKey="rating" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.rating} fill={RATING_COLORS[d.rating] ?? "#a1a1aa"} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-xs">
        {data.map((d) => (
          <li key={d.rating} className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: RATING_COLORS[d.rating] ?? "#a1a1aa" }} />
            {d.rating} · <span className="font-medium text-foreground">{d.jumlah}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BagianDonut({ data }: { data: Stats["perBagian"] }) {
  return (
    <div className="flex h-56 items-center gap-4">
      <div className="h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="jumlah" nameKey="bagian" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={d.bagian} fill={BAGIAN_COLORS[i % BAGIAN_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="max-h-56 space-y-1.5 overflow-auto pr-1 text-xs">
        {data.map((d, i) => (
          <li key={d.bagian} className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: BAGIAN_COLORS[i % BAGIAN_COLORS.length] }} />
            <span className="truncate">{d.bagian}</span> · <span className="font-medium text-foreground">{d.jumlah}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
