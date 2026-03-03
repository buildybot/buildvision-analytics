"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const COLORS = ["#0066ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1"];
const CARRIER_COLOR = "#0066ff";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3 text-sm shadow-xl">
      <div className="text-[#9ca3af] mb-2 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#9ca3af]">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
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
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader
          title="Spec Share by Manufacturer"
          subtitle="Total specifications across all projects"
        />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={marketShare} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="specs" name="Total Specs" radius={[0, 4, 4, 0]}>
              {marketShare.map((entry, index) => (
                <Cell key={index} fill={entry.name === "Carrier" ? CARRIER_COLOR : "#1f2937"} stroke={entry.name === "Carrier" ? "#0066ff" : "#374151"} strokeWidth={1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Performance */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader
          title="Regional Performance"
          subtitle="Win rate and spec volume by region"
        />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={regional} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
            <Bar yAxisId="left" dataKey="specs" name="Total Specs" fill="#1f2937" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="won" name="Wins" fill={CARRIER_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
