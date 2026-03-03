"use client";

import { SectionHeader } from "@/components/ui/section-header";

function heatColor(pct: number): string {
  if (pct >= 45) return "bg-emerald-500/80 text-emerald-100";
  if (pct >= 35) return "bg-emerald-500/50 text-emerald-200";
  if (pct >= 25) return "bg-[#0066ff]/50 text-blue-200";
  if (pct >= 15) return "bg-[#0066ff]/25 text-blue-300";
  if (pct >= 5) return "bg-[#1f2937] text-[#9ca3af]";
  return "bg-[#111827] text-[#4b5563]";
}

export function BODHeatmap({ data, mfgs }: { data: { firm: string; region: string; [mfg: string]: any }[]; mfgs: string[] }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
      <SectionHeader
        title="BOD % Matrix — Firm × Manufacturer"
        subtitle="Avg basis of design % across all equipment types (2025). Darker = stronger relationship."
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[#6b7280] font-medium pb-2 pr-3 whitespace-nowrap">Engineering Firm</th>
              <th className="text-left text-[#6b7280] font-medium pb-2 pr-3">Region</th>
              {mfgs.map(mfg => (
                <th key={mfg} className="text-center text-[#6b7280] font-medium pb-2 px-2 whitespace-nowrap min-w-[70px]">
                  {mfg}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="pr-3 py-1 text-white font-medium whitespace-nowrap">{row.firm}</td>
                <td className="pr-3 py-1 text-[#6b7280] text-xs whitespace-nowrap">{row.region}</td>
                {mfgs.map(mfg => {
                  const val = row[mfg] ?? 0;
                  return (
                    <td key={mfg} className="text-center py-1 px-1">
                      <div className={`rounded px-2 py-1.5 text-xs font-mono font-semibold ${heatColor(val)}`}>
                        {val > 0 ? `${val}%` : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-[#6b7280]">
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-emerald-500/80" /><span>≥45% (Dominant)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-[#0066ff]/50" /><span>25-44% (Strong)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-[#1f2937]" /><span>5-24% (Occasional)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-3 rounded bg-[#111827] border border-[#1f2937]" /><span>&lt;5% (Rare)</span></div>
      </div>
    </div>
  );
}
