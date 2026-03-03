"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const BV_BLUE   = "#4A3AFF";
const BV_PALETTE = ["#4A3AFF", "#16DA7C", "#FFCC17", "#CC98F6", "#EC4343", "#7383FF"];
const GRID_COLOR = "#EDEDED";
const AXIS_COLOR = "#6C6C71";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-sm shadow-xl"
      style={{ background: "#FFFFFF", border: "1px solid #C9CBCF", color: "#2A2A2F" }}>
      <div className="mb-2 font-medium" style={{ color: "#6C6C71" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#6C6C71" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "#2A2A2F" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  marketShare: { name: string; specs: number; wins: number }[];
  regional: { region: string; specs: number; won: number; value: number; winRate: number }[];
}

export function ManufacturerOverviewCharts({ marketShare, regional }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Market Share by Spec Count */}
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader
          title="Spec Share by Manufacturer"
          subtitle="Total specifications across all projects"
        />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={marketShare} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
            <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="specs" name="Total Specs" radius={[0, 4, 4, 0]}>
              {marketShare.map((entry, index) => (
                <Cell key={index}
                  fill={entry.name === "Carrier" ? BV_BLUE : "#EDEDED"}
                  stroke={entry.name === "Carrier" ? BV_BLUE : "#C9CBCF"}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Performance */}
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader
          title="Regional Performance"
          subtitle="Win rate and spec volume by region"
        />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={regional} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="region" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: AXIS_COLOR }} />
            <Bar yAxisId="left" dataKey="specs" name="Total Specs" fill="#EDEDED" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="won" name="Wins" fill={BV_BLUE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
