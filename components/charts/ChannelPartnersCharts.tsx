"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const BV_PALETTE = ["#4A3AFF", "#16DA7C", "#FFCC17", "#CC98F6", "#EC4343", "#7383FF"];
const GRID_COLOR  = "#EDEDED";
const AXIS_COLOR  = "#6C6C71";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-sm shadow-xl"
      style={{ background: "#FFFFFF", border: "1px solid #C9CBCF", color: "#2A2A2F" }}>
      <div className="mb-1 font-medium" style={{ color: "#6C6C71" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: "#2A2A2F" }}>{p.name}: <span className="font-mono">${(p.value / 1e6).toFixed(2)}M</span></div>
      ))}
    </div>
  );
};

export function ChannelPartnersCharts({ bySpecialty, byRegion }: {
  bySpecialty: { name: string; volume: number }[];
  byRegion: { region: string; volume: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader title="Volume by Specialty" subtitle="Annual Carrier equipment volume by sub trade" />
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={bySpecialty.map((s, i) => ({ ...s, color: BV_PALETTE[i % BV_PALETTE.length] }))}
              cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="volume">
              {bySpecialty.map((_, i) => <Cell key={i} fill={BV_PALETTE[i % BV_PALETTE.length]} stroke="transparent" />)}
            </Pie>
            <Tooltip
              formatter={(v: any) => [`$${(v / 1e6).toFixed(2)}M`, "Volume"]}
              contentStyle={{ background: "#FFFFFF", border: "1px solid #C9CBCF", borderRadius: "8px", color: "#2A2A2F" }}
            />
            <Legend formatter={(v) => <span style={{ color: "#6C6C71", fontSize: "11px" }}>{v}</span>} iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader title="Volume by Region" subtitle="Where Carrier sub network is strongest" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byRegion} margin={{ top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="region" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" name="Volume" radius={[4, 4, 0, 0]}>
              {byRegion.map((_, i) => <Cell key={i} fill={BV_PALETTE[i % BV_PALETTE.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
