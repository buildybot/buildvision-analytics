import { db } from "@/db/client";
import { basis_of_design, engineering_firms, manufacturers, equipment_types } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Building2, TrendingUp } from "lucide-react";

const CARRIER_ID = 1;
const REP_REGION = "Northeast";

async function getMyFirmsData() {
  // Carrier BOD at each firm in my region
  const carrierBOD = await db.select({
    firm_id: engineering_firms.id,
    firm_name: engineering_firms.name,
    firm_city: engineering_firms.city,
    firm_state: engineering_firms.state,
    eq_name: equipment_types.name,
    bod_pct: basis_of_design.bod_percentage,
    project_count: basis_of_design.project_count,
    year: basis_of_design.year,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(equipment_types, eq(basis_of_design.equipment_type_id, equipment_types.id))
    .where(and(
      eq(basis_of_design.manufacturer_id, CARRIER_ID),
      eq(basis_of_design.region, REP_REGION),
      eq(basis_of_design.year, 2025)
    ))
    .orderBy(sql`bod_percentage desc`);

  // Top competitor at each firm
  const compBOD = await db.select({
    firm_id: engineering_firms.id,
    mfg_name: manufacturers.name,
    bod_pct: sql<number>`avg(bod_percentage)`,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(manufacturers, eq(basis_of_design.manufacturer_id, manufacturers.id))
    .where(and(
      sql`basis_of_design.manufacturer_id != ${CARRIER_ID}`,
      eq(basis_of_design.region, REP_REGION),
      eq(basis_of_design.year, 2025)
    ))
    .groupBy(engineering_firms.id, manufacturers.name)
    .orderBy(sql`avg(bod_percentage) desc`);

  // Build top comp per firm
  const topCompPerFirm: { [firmId: number]: { name: string; pct: number } } = {};
  for (const r of compBOD) {
    if (!topCompPerFirm[r.firm_id] || r.bod_pct > topCompPerFirm[r.firm_id].pct) {
      topCompPerFirm[r.firm_id] = { name: r.mfg_name.replace(" Technologies", "").replace(" Applied", ""), pct: Number(r.bod_pct) };
    }
  }

  return { carrierBOD, topCompPerFirm };
}

export default async function RepEngineeringFirmsPage() {
  const { carrierBOD, topCompPerFirm } = await getMyFirmsData();

  // Group by firm
  const firmMap: { [firmId: number]: { name: string; city: string; state: string; eqTypes: { name: string; bod: number; projects: number }[] } } = {};
  for (const r of carrierBOD) {
    if (!firmMap[r.firm_id]) firmMap[r.firm_id] = { name: r.firm_name, city: r.firm_city ?? "", state: r.firm_state ?? "", eqTypes: [] };
    firmMap[r.firm_id].eqTypes.push({ name: r.eq_name, bod: Math.round(Number(r.bod_pct)), projects: r.project_count });
  }

  const firms = Object.entries(firmMap).map(([idStr, d]) => {
    const id = parseInt(idStr);
    const avgBOD = d.eqTypes.length > 0 ? Math.round(d.eqTypes.reduce((s, e) => s + e.bod, 0) / d.eqTypes.length) : 0;
    return { id, ...d, avgBOD, topComp: topCompPerFirm[id] };
  }).sort((a, b) => b.avgBOD - a.avgBOD);

  const avgBOD = firms.length ? Math.round(firms.reduce((s, f) => s + f.avgBOD, 0) / firms.length) : 0;
  const strongCount = firms.filter(f => f.avgBOD >= 30).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#2A2A2F] text-xl font-bold">My Engineering Firms</h1>
        <p className="text-[#6C6C71] text-sm">Carrier BOD at my Northeast accounts — 2025</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Avg Carrier BOD%" value={`${avgBOD}%`} sub="Across my accounts" icon={Building2} color="blue" />
        <KpiCard label="Strong Accounts" value={strongCount} sub="Firms with ≥30% Carrier BOD" icon={TrendingUp} color="green" />
      </div>

      <div className="space-y-4">
        {firms.map((firm, i) => (
          <div key={i} className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[#2A2A2F] font-semibold">{firm.name}</div>
                <div className="text-[#6C6C71] text-sm">{firm.city}, {firm.state}</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${firm.avgBOD >= 35 ? "text-emerald-400" : firm.avgBOD >= 20 ? "text-[#4A3AFF]" : "text-amber-400"}`}>
                  {firm.avgBOD}%
                </div>
                <div className="text-[#6C6C71] text-xs">Avg BOD</div>
              </div>
            </div>
            {firm.topComp && firm.topComp.pct > firm.avgBOD && (
              <div className="mb-3 text-xs text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded px-3 py-1.5">
                ⚠ {firm.topComp.name} leads with {Math.round(firm.topComp.pct)}% BOD — opportunity to gain share
              </div>
            )}
            <div className="space-y-1.5">
              {firm.eqTypes.sort((a, b) => b.bod - a.bod).map((eq, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="text-[#6C6C71] text-xs w-48 truncate flex-shrink-0">{eq.name.replace("Chiller — ", "").replace("VRF / VRV System", "VRF")}</div>
                  <div className="flex-1 h-1.5 bg-[#EDEDED] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${eq.bod}%`, background: eq.bod >= 35 ? "#16DA7C" : eq.bod >= 20 ? "#4A3AFF" : "#f59e0b" }} />
                  </div>
                  <span className="text-[#2A2A2F] text-xs font-mono w-8 text-right">{eq.bod}%</span>
                  <span className="text-[#6C6C71] text-xs w-16">{eq.projects} proj</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
