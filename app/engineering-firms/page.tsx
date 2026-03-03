import { db } from "@/db/client";
import { engineering_firms, basis_of_design, spec_activity, manufacturers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users, Building2, TrendingUp } from "lucide-react";

const CARRIER_ID = 1;

async function getFirmsData() {
  const firms = await db.select({
    id: engineering_firms.id,
    name: engineering_firms.name,
    city: engineering_firms.city,
    state: engineering_firms.state,
    region: engineering_firms.region,
    size_tier: engineering_firms.size_tier,
    carrier_bod: sql<number>`(select avg(bod_percentage) from basis_of_design where engineering_firm_id = engineering_firms.id and manufacturer_id = ${CARRIER_ID} and year = 2025)`,
    top_competitor_bod: sql<number>`(select max(avg_bod) from (select avg(bod_percentage) avg_bod from basis_of_design where engineering_firm_id = engineering_firms.id and manufacturer_id != ${CARRIER_ID} and year = 2025 group by manufacturer_id))`,
    top_competitor_name: sql<string>`(select m.name from basis_of_design b join manufacturers m on b.manufacturer_id = m.id where b.engineering_firm_id = engineering_firms.id and b.manufacturer_id != ${CARRIER_ID} and b.year = 2025 group by b.manufacturer_id, m.name order by avg(b.bod_percentage) desc limit 1)`,
    total_projects: sql<number>`(select count(*) from spec_activity where engineering_firm_id = engineering_firms.id)`,
    carrier_wins: sql<number>`(select count(*) from spec_activity where engineering_firm_id = engineering_firms.id and manufacturer_id = ${CARRIER_ID} and status = 'won')`,
    carrier_losses: sql<number>`(select count(*) from spec_activity where engineering_firm_id = engineering_firms.id and manufacturer_id = ${CARRIER_ID} and status = 'lost')`,
  }).from(engineering_firms);

  return firms.sort((a, b) => Number(b.carrier_bod ?? 0) - Number(a.carrier_bod ?? 0));
}

export default async function EngineeringFirmsPage() {
  const firms = await getFirmsData();

  const avgBOD = firms.length
    ? firms.reduce((s, f) => s + Number(f.carrier_bod ?? 0), 0) / firms.length
    : 0;
  const strongCount = firms.filter(f => Number(f.carrier_bod ?? 0) >= 30).length;
  const atRiskCount = firms.filter(f => Number(f.top_competitor_bod ?? 0) > Number(f.carrier_bod ?? 0)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-xl font-bold">Engineering Firms</h1>
        <p className="text-[#6b7280] text-sm">Specifier relationships — BOD%, loyalty, and competitive position</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Avg Carrier BOD%" value={`${Math.round(avgBOD)}%`} sub="Across all tracked firms" icon={Building2} color="blue" />
        <KpiCard label="Strong Relationships" value={strongCount} sub="Firms with ≥30% Carrier BOD" icon={TrendingUp} color="green" />
        <KpiCard label="At-Risk Firms" value={atRiskCount} sub="Competitor leads Carrier BOD" icon={Users} color="red" />
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader
          title="All Engineering Firms"
          subtitle="Carrier BOD%, competitive threat, and project history"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2937]">
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Firm</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Location</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Region</th>
                <th className="text-right text-[#6b7280] font-medium pb-3 pr-4">Carrier BOD%</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Top Competitor</th>
                <th className="text-right text-[#6b7280] font-medium pb-3 pr-4">Projects</th>
                <th className="text-right text-[#6b7280] font-medium pb-3 pr-4">W</th>
                <th className="text-right text-[#6b7280] font-medium pb-3">L</th>
              </tr>
            </thead>
            <tbody>
              {firms.map((firm, i) => {
                const bod = Math.round(Number(firm.carrier_bod ?? 0));
                const compBod = Math.round(Number(firm.top_competitor_bod ?? 0));
                const isAtRisk = compBod > bod;
                return (
                  <tr key={i} className="border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/50 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {isAtRisk && <span className="text-red-400 text-xs">⚠</span>}
                        <span className="text-white font-medium">{firm.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-[#9ca3af]">{firm.city}, {firm.state}</td>
                    <td className="py-2.5 pr-4 text-[#6b7280] text-xs">{firm.region}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${bod}%`, background: bod >= 35 ? "#10b981" : bod >= 20 ? "#0066ff" : "#f59e0b" }} />
                        </div>
                        <span className={`font-mono text-xs font-semibold ${bod >= 35 ? "text-emerald-400" : bod >= 20 ? "text-[#0066ff]" : "text-amber-400"}`}>{bod}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {firm.top_competitor_name ? (
                        <div>
                          <span className="text-[#9ca3af] text-xs">{firm.top_competitor_name?.replace(" Technologies", "").replace(" Applied", "")}</span>
                          <span className={`ml-2 font-mono text-xs ${isAtRisk ? "text-red-400" : "text-[#6b7280]"}`}>{compBod}%</span>
                        </div>
                      ) : <span className="text-[#4b5563]">—</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-[#9ca3af]">{Number(firm.total_projects)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-emerald-400">{Number(firm.carrier_wins)}</td>
                    <td className="py-2.5 text-right font-mono text-red-400">{Number(firm.carrier_losses)}</td>
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
