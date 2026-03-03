"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const CARRIER_COLOR = "#0066ff";
const COMP_COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1", "#14b8a6", "#fb923c"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3 text-sm shadow-xl">
      <div className="text-[#9ca3af] mb-2 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#9ca3af]">{p.name}:</span>
          <span className="text-white font-medium">{p.name?.includes("Rate") ? `${p.value}%` : p.name?.includes("Value") ? `$${(p.value / 1e6).toFixed(1)}M` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  byMfg: { name: string; total: number; won: number; lost: number; winRate: number; value: number }[];
  byRegion: { region: string; total: number; won: number; winRate: number }[];
  byEqType: { name: string; total: number; won: number; winRate: number }[];
}

export function MarketShareCharts({ byMfg, byRegion, byEqType }: Props) {
  // Pie chart: top 8 by total specs
  const pieData = byMfg.slice(0, 8).map((m, i) => ({
    name: m.name,
    value: m.total,
    color: m.name === "Carrier" ? CARRIER_COLOR : COMP_COLORS[i % COMP_COLORS.length],
  }));

  // Win rate comparison (top 8 mfgs with enough specs)
  const winRateData = byMfg.filter(m => m.total >= 10).slice(0, 8).map(m => ({
    name: m.name,
    winRate: m.winRate,
    isCarrier: m.name === "Carrier",
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie: spec share */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
          <SectionHeader title="Spec Share" subtitle="All manufacturers" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(value: any, name: any) => [value, name]} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
              <Legend
                formatter={(value) => <span style={{ color: "#9ca3af", fontSize: "10px" }}>{value}</span>}
                iconSize={8}
                wrapperStyle={{ paddingTop: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: win rate comparison */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
          <SectionHeader title="Win Rate by Manufacturer" subtitle="Decided specs only" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winRateData} layout="vertical" margin={{ left: 4, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={68} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="winRate" name="Win Rate" radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: "#9ca3af", fontSize: 10, formatter: (v: any) => `${v}%` }}>
                {winRateData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCarrier ? CARRIER_COLOR : "#374151"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: regional win rate */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
          <SectionHeader title="Carrier Win Rate by Region" subtitle="Where we're strongest" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byRegion} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="winRate" name="Win Rate" fill={CARRIER_COLOR} radius={[4, 4, 0, 0]}
                label={{ position: "top", fill: "#9ca3af", fontSize: 10, formatter: (v: any) => `${v}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equipment type win rate */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Carrier Performance by Equipment Category" subtitle="Specs and win rate — where Carrier is strongest and weakest" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byEqType} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }} />
            <Bar yAxisId="left" dataKey="total" name="Total Specs" fill="#1f2937" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="won" name="Won" fill={CARRIER_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
