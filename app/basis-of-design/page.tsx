import { db } from "@/db/client";
import { basis_of_design, engineering_firms, manufacturers, equipment_types } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { BODHeatmap } from "@/components/charts/BODHeatmap";
import { Building2, TrendingUp, Target } from "lucide-react";

const CARRIER_ID = 1;

async function getBODData() {
  const rows = await db.select({
    firm_id: basis_of_design.engineering_firm_id,
    firm_name: engineering_firms.name,
    firm_city: engineering_firms.city,
    firm_state: engineering_firms.state,
    firm_region: engineering_firms.region,
    mfg_id: basis_of_design.manufacturer_id,
    mfg_name: manufacturers.name,
    eq_name: equipment_types.name,
    bod_pct: basis_of_design.bod_percentage,
    project_count: basis_of_design.project_count,
    year: basis_of_design.year,
    region: basis_of_design.region,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(manufacturers, eq(basis_of_design.manufacturer_id, manufacturers.id))
    .innerJoin(equipment_types, eq(basis_of_design.equipment_type_id, equipment_types.id))
    .where(eq(basis_of_design.year, 2025));

  return rows;
}

export default async function BODPage() {
  const rows = await getBODData();

  const carrierRows = rows.filter(r => r.mfg_id === CARRIER_ID);
  const avgCarrierBOD = carrierRows.length
    ? carrierRows.reduce((s, r) => s + Number(r.bod_pct), 0) / carrierRows.length
    : 0;

  const topFirmBOD = [...carrierRows]
    .sort((a, b) => Number(b.bod_pct) - Number(a.bod_pct))
    .slice(0, 1)[0];

  // Firms where Carrier BOD > 35% (strong relationships)
  const firmBODMap: { [firmId: number]: { name: string; region: string; total: number; count: number } } = {};
  for (const r of carrierRows) {
    if (!firmBODMap[r.firm_id]) firmBODMap[r.firm_id] = { name: r.firm_name, region: r.firm_region ?? "", total: 0, count: 0 };
    firmBODMap[r.firm_id].total += Number(r.bod_pct);
    firmBODMap[r.firm_id].count++;
  }
  const strongFirms = Object.values(firmBODMap).filter(f => f.total / f.count >= 35).length;

  // Build heatmap data: firms × manufacturers
  const firms = [...new Set(rows.map(r => r.firm_name))].slice(0, 12);
  const mfgs = ["Carrier", "Trane Technologies", "Daikin Applied", "Johnson Controls", "Lennox Commercial"];

  const heatmapData: { firm: string; region: string; [mfg: string]: any }[] = firms.map(firmName => {
    const firmRows = rows.filter(r => r.firm_name === firmName);
    const obj: any = {
      firm: firmName.replace(" Consulting Engineers", "").replace(" Associates", ""),
      region: firmRows[0]?.firm_region ?? "",
    };
    for (const mfg of mfgs) {
      const mfgRows = firmRows.filter(r => r.mfg_name === mfg);
      obj[mfg.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", "")] =
        mfgRows.length ? Math.round(mfgRows.reduce((s, r) => s + Number(r.bod_pct), 0) / mfgRows.length) : 0;
    }
    return obj;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-xl font-bold">Basis of Design</h1>
        <p className="text-[#6b7280] text-sm">Which firms spec Carrier — and how often (2025)</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Avg Carrier BOD %" value={`${Math.round(avgCarrierBOD)}%`} sub="Across all firms & equipment types" icon={Target} color="blue" />
        <KpiCard label="Strong Relationships" value={strongFirms} sub="Firms where Carrier BOD ≥ 35%" icon={Building2} color="green" />
        <KpiCard label="Top BOD Firm" value={topFirmBOD?.firm_name?.split(" ")[0] ?? "—"} sub={`${Math.round(Number(topFirmBOD?.bod_pct ?? 0))}% BOD — ${topFirmBOD?.firm_city}`} icon={TrendingUp} color="amber" />
      </div>

      <BODHeatmap data={heatmapData} mfgs={mfgs.map(m => m.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", ""))} />

      {/* Full BOD Table */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Carrier BOD by Firm & Equipment Type" subtitle="2025 data — sorted by BOD%" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2937]">
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Engineering Firm</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Region</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Equipment</th>
                <th className="text-right text-[#6b7280] font-medium pb-3 pr-4">Carrier BOD%</th>
                <th className="text-right text-[#6b7280] font-medium pb-3">Projects</th>
              </tr>
            </thead>
            <tbody>
              {carrierRows
                .sort((a, b) => Number(b.bod_pct) - Number(a.bod_pct))
                .slice(0, 40)
                .map((row, i) => {
                  const pct = Math.round(Number(row.bod_pct));
                  return (
                    <tr key={i} className="border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/50 transition-colors">
                      <td className="py-2.5 pr-4 text-white font-medium">{row.firm_name}</td>
                      <td className="py-2.5 pr-4 text-[#9ca3af]">{row.firm_region}</td>
                      <td className="py-2.5 pr-4 text-[#9ca3af]">{row.eq_name}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 40 ? "#10b981" : pct >= 25 ? "#0066ff" : "#f59e0b" }} />
                          </div>
                          <span className={`font-mono text-sm ${pct >= 40 ? "text-emerald-400" : pct >= 25 ? "text-[#0066ff]" : "text-amber-400"}`}>{pct}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-[#9ca3af]">{row.project_count}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
