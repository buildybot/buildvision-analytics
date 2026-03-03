"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine, Legend
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3 text-sm shadow-xl">
      <div className="text-[#9ca3af] mb-1 font-medium">{label ?? payload[0]?.name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-white">{p.name}: <span className="font-mono">{typeof p.value === "number" ? `$${Math.round(p.value).toLocaleString()}` : p.value}</span></div>
      ))}
    </div>
  );
};

export function PricingCharts({ chillerData, ahuData, allData }: {
  chillerData: any[];
  ahuData: any[];
  allData: any[];
}) {
  // Aggregate by manufacturer across all regions for chillers
  const chillerByMfg: { [name: string]: number[] } = {};
  for (const d of chillerData) {
    const n = d.manufacturer_name.replace(" Technologies", "").replace(" Applied", "");
    if (!chillerByMfg[n]) chillerByMfg[n] = [];
    chillerByMfg[n].push(Number(d.avg_price_per_unit));
  }
  const chillerChartData = Object.entries(chillerByMfg)
    .map(([name, vals]) => ({
      name,
      avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }))
    .sort((a, b) => a.avg - b.avg);

  const carrierChillerAvg = chillerChartData.find(d => d.name === "Carrier")?.avg ?? 0;

  // AHU by mfg
  const ahuByMfg: { [name: string]: number[] } = {};
  for (const d of ahuData) {
    const n = d.manufacturer_name.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", "");
    if (!ahuByMfg[n]) ahuByMfg[n] = [];
    ahuByMfg[n].push(Number(d.avg_price_per_unit));
  }
  const ahuChartData = Object.entries(ahuByMfg)
    .map(([name, vals]) => ({
      name,
      avg: parseFloat((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2)),
    }))
    .sort((a, b) => a.avg - b.avg);

  // Year-over-year trend for Carrier chillers
  const carrierYoY = chillerData
    .filter(d => d.manufacturer_name === "Carrier")
    .reduce((acc: { [y: string]: number[] }, d) => {
      const y = String(d.year);
      if (!acc[y]) acc[y] = [];
      acc[y].push(Number(d.avg_price_per_unit));
      return acc;
    }, {});
  const trendData = Object.entries(carrierYoY)
    .map(([year, vals]) => ({
      year,
      avg: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chiller $/ton comparison */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
          <SectionHeader title="Chiller $/Ton by Manufacturer" subtitle="National avg 2025 — lower is more competitive" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chillerChartData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={82} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={carrierChillerAvg} stroke="#0066ff" strokeDasharray="4 2" label={{ value: "Carrier", fill: "#0066ff", fontSize: 10 }} />
              <Bar dataKey="avg" name="$/Ton" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#9ca3af", fontSize: 10, formatter: (v: any) => `$${v}` }}>
                {chillerChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "Carrier" ? "#0066ff" : entry.avg < carrierChillerAvg ? "#ef4444" : "#1f2937"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AHU $/CFM comparison */}
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
          <SectionHeader title="AHU $/CFM by Manufacturer" subtitle="National avg 2025" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ahuChartData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={82} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="$/CFM" radius={[0, 4, 4, 0]} label={{ position: "right", fill: "#9ca3af", fontSize: 10, formatter: (v: any) => `$${v}` }}>
                {ahuChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "Carrier" ? "#0066ff" : "#1f2937"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carrier price trend */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Carrier Chiller Pricing Trend ($/Ton)" subtitle="Year-over-year national average" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trendData} margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="$/Ton" fill="#0066ff" radius={[4, 4, 0, 0]}
              label={{ position: "top", fill: "#9ca3af", fontSize: 11, formatter: (v: any) => `$${v}` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
