"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const BV_BLUE    = "#4A3AFF";
const COMP_COLORS = ["#16DA7C", "#FFCC17", "#CC98F6", "#EC4343", "#7383FF", "#0EA5E9", "#F97316", "#84CC16", "#14B8A6", "#FB923C"];
const GRID_COLOR  = "#EDEDED";
const AXIS_COLOR  = "#6C6C71";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-sm shadow-xl"
      style={{ background: "#FFFFFF", border: "1px solid #C9CBCF", color: "#2A2A2F" }}>
      <div className="mb-2 font-medium" style={{ color: "#6C6C71" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: "#6C6C71" }}>{p.name}:</span>
          <span className="font-medium" style={{ color: "#2A2A2F" }}>
            {p.name?.includes("Rate") ? `${p.value}%`
              : p.name?.includes("Value") ? `$${(p.value / 1e6).toFixed(1)}M`
              : p.value}
          </span>
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
  const pieData = byMfg.slice(0, 8).map((m, i) => ({
    name: m.name,
    value: m.total,
    color: m.name === "Carrier" ? BV_BLUE : COMP_COLORS[i % COMP_COLORS.length],
  }));

  const winRateData = byMfg.filter(m => m.total >= 10).slice(0, 8).map(m => ({
    name: m.name,
    winRate: m.winRate,
    isCarrier: m.name === "Carrier",
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie: spec share */}
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionHeader title="Spec Share" subtitle="All manufacturers" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value, name]}
                contentStyle={{ background: "#FFFFFF", border: "1px solid #C9CBCF", borderRadius: "8px", color: "#2A2A2F" }}
              />
              <Legend
                formatter={(value) => <span style={{ color: "#6C6C71", fontSize: "10px" }}>{value}</span>}
                iconSize={8}
                wrapperStyle={{ paddingTop: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: win rate comparison */}
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionHeader title="Win Rate by Manufacturer" subtitle="Decided specs only" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winRateData} layout="vertical" margin={{ left: 4, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} width={68} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="winRate" name="Win Rate" radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: AXIS_COLOR, fontSize: 10, formatter: (v: any) => `${v}%` }}>
                {winRateData.map((entry, i) => (
                  <Cell key={i} fill={entry.isCarrier ? BV_BLUE : "#EDEDED"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: regional win rate */}
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionHeader title="Carrier Win Rate by Region" subtitle="Where we're strongest" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byRegion} margin={{ top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="region" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="winRate" name="Win Rate" fill={BV_BLUE} radius={[4, 4, 0, 0]}
                label={{ position: "top", fill: AXIS_COLOR, fontSize: 10, formatter: (v: any) => `${v}%` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Equipment type win rate */}
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader title="Carrier Performance by Equipment Category" subtitle="Specs and win rate — where Carrier is strongest and weakest" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byEqType} margin={{ left: 0, right: 16, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", color: AXIS_COLOR }} />
            <Bar yAxisId="left" dataKey="total" name="Total Specs" fill="#EDEDED" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="won" name="Won" fill={BV_BLUE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
