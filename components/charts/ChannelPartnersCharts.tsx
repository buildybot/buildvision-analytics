"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const COLORS = ["#0066ff", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3 text-sm shadow-xl">
      <div className="text-[#9ca3af] mb-1 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-white">{p.name}: <span className="font-mono">${(p.value / 1e6).toFixed(2)}M</span></div>
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
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Volume by Specialty" subtitle="Annual Carrier equipment volume by sub trade" />
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={bySpecialty.map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }))}
              cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="volume">
              {bySpecialty.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
            </Pie>
            <Tooltip formatter={(v: any) => [`$${(v / 1e6).toFixed(2)}M`, "Volume"]} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
            <Legend formatter={(v) => <span style={{ color: "#9ca3af", fontSize: "11px" }}>{v}</span>} iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Volume by Region" subtitle="Where Carrier sub network is strongest" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byRegion} margin={{ top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" name="Volume" fill="#0066ff" radius={[4, 4, 0, 0]}>
              {byRegion.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
