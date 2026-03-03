"use client";

import { SectionHeader } from "@/components/ui/section-header";

function heatColor(pct: number): { bg: string; color: string } {
  if (pct >= 45) return { bg: "rgba(22,218,124,0.85)",  color: "#0A5C33" };
  if (pct >= 35) return { bg: "rgba(22,218,124,0.45)",  color: "#0D7A43" };
  if (pct >= 25) return { bg: "rgba(74,58,255,0.45)",   color: "#2A1FA0" };
  if (pct >= 15) return { bg: "rgba(74,58,255,0.18)",   color: "#3F31DE" };
  if (pct >= 5)  return { bg: "#EDEDED",                color: "#6C6C71" };
  return            { bg: "#F8F8F8",                    color: "#AEB0B7" };
}

export function BODHeatmap({ data, mfgs }: { data: { firm: string; region: string; [mfg: string]: any }[]; mfgs: string[] }) {
  return (
    <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <SectionHeader
        title="BOD % Matrix — Firm × Manufacturer"
        subtitle="Avg basis of design % across all equipment types (2025). Darker = stronger relationship."
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left font-medium pb-2 pr-3 whitespace-nowrap" style={{ color: "#6C6C71" }}>Engineering Firm</th>
              <th className="text-left font-medium pb-2 pr-3" style={{ color: "#6C6C71" }}>Region</th>
              {mfgs.map(mfg => (
                <th key={mfg} className="text-center font-medium pb-2 px-2 whitespace-nowrap min-w-[70px]" style={{ color: "#6C6C71" }}>
                  {mfg}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="pr-3 py-1 font-medium whitespace-nowrap" style={{ color: "var(--foreground)" }}>{row.firm}</td>
                <td className="pr-3 py-1 text-xs whitespace-nowrap" style={{ color: "#6C6C71" }}>{row.region}</td>
                {mfgs.map(mfg => {
                  const val = row[mfg] ?? 0;
                  const { bg, color } = heatColor(val);
                  return (
                    <td key={mfg} className="text-center py-1 px-1">
                      <div className="rounded px-2 py-1.5 text-xs font-mono font-semibold" style={{ background: bg, color }}>
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
      <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: "#6C6C71" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded" style={{ background: "rgba(22,218,124,0.85)" }} />
          <span>≥45% (Dominant)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded" style={{ background: "rgba(74,58,255,0.45)" }} />
          <span>25–44% (Strong)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded" style={{ background: "#EDEDED" }} />
          <span>5–24% (Occasional)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded" style={{ background: "#F8F8F8", border: "1px solid #C9CBCF" }} />
          <span>&lt;5% (Rare)</span>
        </div>
      </div>
    </div>
  );
}
