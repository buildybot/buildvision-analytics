"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine
} from "recharts";
import { SectionHeader } from "@/components/ui/section-header";

const BV_BLUE  = "#4A3AFF";
const BV_RED   = "#EC4343";
const GRID_COLOR = "#EDEDED";
const AXIS_COLOR = "#6C6C71";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-sm shadow-xl"
      style={{ background: "#FFFFFF", border: "1px solid #C9CBCF", color: "#2A2A2F" }}>
      <div className="mb-1 font-medium" style={{ color: "#6C6C71" }}>{label ?? payload[0]?.name}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: "#2A2A2F" }}>
          {p.name}: <span className="font-mono">{typeof p.value === "number" ? `$${Math.round(p.value).toLocaleString()}` : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function PricingCharts({ chillerData, ahuData, allData }: {
  chillerData: any[];
  ahuData: any[];
  allData: any[];
}) {
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
        {/* Chiller $/ton */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionHeader title="Chiller $/Ton by Manufacturer" subtitle="National avg 2025 — lower is more competitive" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chillerChartData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={82} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={carrierChillerAvg} stroke={BV_BLUE} strokeDasharray="4 2"
                label={{ value: "Carrier", fill: BV_BLUE, fontSize: 10 }} />
              <Bar dataKey="avg" name="$/Ton" radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: AXIS_COLOR, fontSize: 10, formatter: (v: any) => `$${v}` }}>
                {chillerChartData.map((entry, i) => (
                  <Cell key={i}
                    fill={entry.name === "Carrier" ? BV_BLUE : entry.avg < carrierChillerAvg ? BV_RED : "#EDEDED"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AHU $/CFM */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <SectionHeader title="AHU $/CFM by Manufacturer" subtitle="National avg 2025" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ahuChartData} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
              <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} width={82} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="$/CFM" radius={[0, 4, 4, 0]}
                label={{ position: "right", fill: AXIS_COLOR, fontSize: 10, formatter: (v: any) => `$${v}` }}>
                {ahuChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "Carrier" ? BV_BLUE : "#EDEDED"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Carrier price trend */}
      <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <SectionHeader title="Carrier Chiller Pricing Trend ($/Ton)" subtitle="Year-over-year national average" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={trendData} margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="year" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="$/Ton" fill={BV_BLUE} radius={[4, 4, 0, 0]}
              label={{ position: "top", fill: AXIS_COLOR, fontSize: 11, formatter: (v: any) => `$${v}` }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
