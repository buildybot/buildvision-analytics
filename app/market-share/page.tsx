import { db } from "@/db/client";
import { spec_activity, manufacturers, equipment_types, basis_of_design, engineering_firms } from "@/db/schema";
import { eq, sql, and, ne } from "drizzle-orm";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { MarketShareCharts } from "@/components/charts/MarketShareCharts";
import { Trophy, TrendingUp, AlertTriangle, Target, ArrowUpDown } from "lucide-react";

const CARRIER_ID = 1;

async function getMarketData() {
  // Win/loss by manufacturer (all time)
  const byMfg = await db.select({
    mfg_id: spec_activity.manufacturer_id,
    mfg_name: manufacturers.name,
    total: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
    lost: sql<number>`sum(case when status='lost' then 1 else 0 end)`,
    pending: sql<number>`sum(case when status='pending' then 1 else 0 end)`,
    total_value: sql<number>`sum(value_usd)`,
    won_value: sql<number>`sum(case when status='won' then value_usd else 0 end)`,
  }).from(spec_activity)
    .innerJoin(manufacturers, eq(spec_activity.manufacturer_id, manufacturers.id))
    .groupBy(spec_activity.manufacturer_id, manufacturers.name)
    .orderBy(sql`count(*) desc`);

  // By region for Carrier
  const byRegion = await db.select({
    region: spec_activity.region,
    total: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
    lost: sql<number>`sum(case when status='lost' then 1 else 0 end)`,
  }).from(spec_activity)
    .where(eq(spec_activity.manufacturer_id, CARRIER_ID))
    .groupBy(spec_activity.region);

  // By equipment type for Carrier
  const byEqType = await db.select({
    eq_name: equipment_types.name,
    total: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
  }).from(spec_activity)
    .innerJoin(equipment_types, eq(spec_activity.equipment_type_id, equipment_types.id))
    .where(eq(spec_activity.manufacturer_id, CARRIER_ID))
    .groupBy(equipment_types.name)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // BOD trend: where Carrier is losing to competitors
  const bodThreats = await db.select({
    firm_name: engineering_firms.name,
    firm_region: engineering_firms.region,
    mfg_name: manufacturers.name,
    avg_bod: sql<number>`avg(bod_percentage)`,
    year: basis_of_design.year,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(manufacturers, eq(basis_of_design.manufacturer_id, manufacturers.id))
    .where(and(
      ne(basis_of_design.manufacturer_id, CARRIER_ID),
      sql`bod_percentage > 35`
    ))
    .groupBy(engineering_firms.name, engineering_firms.region, manufacturers.name, basis_of_design.year)
    .orderBy(sql`avg(bod_percentage) desc`)
    .limit(12);

  // Recent displacement events (carrier lost)
  const displacements = await db.select({
    project_name: spec_activity.project_name,
    city: spec_activity.city,
    state: spec_activity.state,
    region: spec_activity.region,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    firm_name: engineering_firms.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .where(and(eq(spec_activity.manufacturer_id, CARRIER_ID), eq(spec_activity.status, "lost")))
    .orderBy(sql`date desc`)
    .limit(8);

  // Recent wins
  const wins = await db.select({
    project_name: spec_activity.project_name,
    city: spec_activity.city,
    region: spec_activity.region,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    eq_name: equipment_types.name,
    firm_name: engineering_firms.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .innerJoin(equipment_types, eq(spec_activity.equipment_type_id, equipment_types.id))
    .where(and(eq(spec_activity.manufacturer_id, CARRIER_ID), eq(spec_activity.status, "won")))
    .orderBy(sql`date desc`)
    .limit(8);

  return { byMfg, byRegion, byEqType, bodThreats, displacements, wins };
}

export default async function MarketSharePage() {
  const data = await getMarketData();

  const carrierRow = data.byMfg.find(r => r.mfg_name === "Carrier");
  const totalAll = data.byMfg.reduce((s, r) => s + Number(r.total), 0);
  const carrierShare = totalAll > 0 ? Math.round((Number(carrierRow?.total ?? 0) / totalAll) * 100) : 0;
  const decidedCarrier = (Number(carrierRow?.won ?? 0)) + (Number(carrierRow?.lost ?? 0));
  const winRate = decidedCarrier > 0 ? Math.round((Number(carrierRow?.won ?? 0) / decidedCarrier) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#2A2A2F] text-xl font-bold">Market Share & Competitive Intel</h1>
        <p className="text-[#6C6C71] text-sm">Win/loss rates, displacement events, and threat analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Carrier Spec Share" value={`${carrierShare}%`} sub={`${carrierRow?.total ?? 0} of ${totalAll} total specs`} icon={Target} color="blue" trend={{ value: 1.8, label: "vs prior year" }} />
        <KpiCard label="Win Rate (Decided)" value={`${winRate}%`} sub={`${carrierRow?.won ?? 0} wins, ${carrierRow?.lost ?? 0} losses`} icon={Trophy} color="green" trend={{ value: 3.1, label: "vs prior year" }} />
        <KpiCard label="Won Value" value={`$${((Number(carrierRow?.won_value ?? 0)) / 1e6).toFixed(1)}M`} sub="Total value of specs won" icon={TrendingUp} color="amber" />
        <KpiCard label="Competitive Threats" value={data.bodThreats.length} sub="Firms where competitor BOD > 35%" icon={AlertTriangle} color="red" />
      </div>

      <MarketShareCharts
        byMfg={data.byMfg.map(r => ({
          name: r.mfg_name.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", "").replace(" Electric", "").replace(" Aircoil", ""),
          total: Number(r.total),
          won: Number(r.won),
          lost: Number(r.lost),
          winRate: (Number(r.won) + Number(r.lost)) > 0 ? Math.round((Number(r.won) / (Number(r.won) + Number(r.lost))) * 100) : 0,
          value: Number(r.won_value),
        }))}
        byRegion={data.byRegion.map(r => ({
          region: r.region,
          total: Number(r.total),
          won: Number(r.won),
          winRate: (Number(r.won) + Number(r.lost)) > 0 ? Math.round((Number(r.won) / (Number(r.won) + Number(r.lost))) * 100) : 0,
        }))}
        byEqType={data.byEqType.map(r => ({
          name: r.eq_name.replace("Chiller — ", "").replace("Cooling Tower — ", "CT ").replace("Heat Pump — ", "HP ").replace("Boiler — ", "").replace("Pump — ", "").replace("VRF / VRV System", "VRF"),
          total: Number(r.total),
          won: Number(r.won),
          winRate: Number(r.total) > 0 ? Math.round((Number(r.won) / Number(r.total)) * 100) : 0,
        }))}
      />

      {/* Threats & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threats */}
        <div className="bg-[#F8F8F8] border border-[#ef4444]/20 rounded-xl p-5">
          <SectionHeader
            title="⚠ Competitive Threats"
            subtitle="Firms where a competitor holds >35% BOD — Carrier at risk"
          />
          <div className="space-y-2">
            {data.bodThreats.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#C9CBCF] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm font-medium">{t.firm_name}</div>
                  <div className="text-[#6C6C71] text-xs">{t.firm_region} · {t.year}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-red-400 text-sm font-semibold">{Math.round(Number(t.avg_bod))}% BOD</div>
                  <div className="text-[#6C6C71] text-xs truncate max-w-[120px]">{t.mfg_name.replace(" Technologies", "").replace(" Applied", "")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Losses */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
          <SectionHeader title="Recent Losses" subtitle="Carrier specs that went to a competitor" />
          <div className="space-y-2">
            {data.displacements.map((d, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-[#C9CBCF] last:border-0">
                <StatusBadge value="lost" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm truncate">{d.project_name}</div>
                  <div className="text-[#6C6C71] text-xs">{d.firm_name} · {d.city} · {d.date}</div>
                </div>
                <div className="text-red-400 text-sm font-mono flex-shrink-0">
                  ${((d.value_usd ?? 0) / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
        <SectionHeader title="✓ Recent Carrier Wins" subtitle="Specs where Carrier captured the business" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {data.wins.map((w, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <StatusBadge value="won" className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[#2A2A2F] text-sm font-medium truncate">{w.project_name}</div>
                <div className="text-[#6C6C71] text-xs">{w.firm_name} · {w.city} · {w.eq_name?.replace("Chiller — ", "").replace("VRF / VRV System", "VRF")}</div>
              </div>
              <div className="text-emerald-400 text-sm font-mono flex-shrink-0">
                ${((w.value_usd ?? 0) / 1000).toFixed(0)}K
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full competitive table */}
      <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
        <SectionHeader title="Full Competitive Landscape" subtitle="All manufacturers — spec count, win rate, won value" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#C9CBCF]">
                <th className="text-left text-[#6C6C71] font-medium pb-3 pr-4">Manufacturer</th>
                <th className="text-right text-[#6C6C71] font-medium pb-3 pr-4">Total Specs</th>
                <th className="text-right text-[#6C6C71] font-medium pb-3 pr-4">Wins</th>
                <th className="text-right text-[#6C6C71] font-medium pb-3 pr-4">Losses</th>
                <th className="text-right text-[#6C6C71] font-medium pb-3 pr-4">Win Rate</th>
                <th className="text-right text-[#6C6C71] font-medium pb-3">Won Value</th>
              </tr>
            </thead>
            <tbody>
              {data.byMfg.map((row, i) => {
                const decided = Number(row.won) + Number(row.lost);
                const wr = decided > 0 ? Math.round((Number(row.won) / decided) * 100) : 0;
                const isCarrier = row.mfg_name === "Carrier";
                return (
                  <tr key={i} className={`border-b border-[#C9CBCF] last:border-0 hover:bg-[#EDEDED]/50 transition-colors ${isCarrier ? "bg-[#4A3AFF]/5" : ""}`}>
                    <td className={`py-2.5 pr-4 font-medium ${isCarrier ? "text-[#4A3AFF]" : "text-[#2A2A2F]"}`}>
                      {isCarrier && <span className="mr-1">●</span>}{row.mfg_name}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-[#6C6C71]">{Number(row.total).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-emerald-400">{Number(row.won).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-red-400">{Number(row.lost).toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1 bg-[#EDEDED] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#4A3AFF]" style={{ width: `${wr}%` }} />
                        </div>
                        <span className="font-mono text-[#2A2A2F] text-xs">{wr}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-[#2A2A2F]">${((Number(row.won_value)) / 1e6).toFixed(1)}M</td>
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
