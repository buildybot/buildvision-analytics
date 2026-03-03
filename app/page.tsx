import { db } from "@/db/client";
import { manufacturers, spec_activity, basis_of_design, engineering_firms, rep_territories, subcontractors } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { BarChart3, Building2, TrendingUp, Users, Wrench, Globe, Trophy, Target } from "lucide-react";
import { ManufacturerOverviewCharts } from "@/components/charts/ManufacturerOverviewCharts";
import { RestrictedBlock } from "@/components/ui/restricted-badge";

const CARRIER_ID = 1;

async function getOverviewData() {
  const [totalMfgs] = await db.select({ count: sql<number>`count(*)` }).from(manufacturers);
  const [totalFirms] = await db.select({ count: sql<number>`count(*)` }).from(engineering_firms);
  const [totalSubs] = await db.select({ count: sql<number>`count(*)` }).from(subcontractors);
  const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(rep_territories).where(eq(rep_territories.manufacturer_id, CARRIER_ID));

  const winLoss = await db.select({
    status: spec_activity.status,
    count: sql<number>`count(*)`,
    value: sql<number>`sum(value_usd)`,
  }).from(spec_activity)
    .where(eq(spec_activity.manufacturer_id, CARRIER_ID))
    .groupBy(spec_activity.status);

  const marketShare = await db.select({
    name: manufacturers.name,
    count: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
  }).from(spec_activity)
    .innerJoin(manufacturers, eq(spec_activity.manufacturer_id, manufacturers.id))
    .groupBy(manufacturers.name)
    .orderBy(sql`count(*) desc`);

  const regional = await db.select({
    region: spec_activity.region,
    count: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
    value: sql<number>`sum(value_usd)`,
  }).from(spec_activity)
    .where(eq(spec_activity.manufacturer_id, CARRIER_ID))
    .groupBy(spec_activity.region);

  const topFirms = await db.select({
    name: engineering_firms.name,
    city: engineering_firms.city,
    state: engineering_firms.state,
    region: engineering_firms.region,
    bod_pct: sql<number>`avg(bod_percentage)`,
    projects: sql<number>`sum(project_count)`,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .where(and(eq(basis_of_design.manufacturer_id, CARRIER_ID), eq(basis_of_design.year, 2025)))
    .groupBy(engineering_firms.id, engineering_firms.name, engineering_firms.city, engineering_firms.state, engineering_firms.region)
    .orderBy(sql`avg(bod_percentage) desc`)
    .limit(8);

  const recentActivity = await db.select({
    id: spec_activity.id,
    project_name: spec_activity.project_name,
    status: spec_activity.status,
    region: spec_activity.region,
    city: spec_activity.city,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    firm_name: engineering_firms.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .where(eq(spec_activity.manufacturer_id, CARRIER_ID))
    .orderBy(sql`date desc`)
    .limit(8);

  return { totalMfgs, totalFirms, totalSubs, totalReps, winLoss, marketShare, regional, topFirms, recentActivity };
}

export default async function OverviewPage() {
  const data = await getOverviewData();

  const won = data.winLoss.find(w => w.status === "won");
  const lost = data.winLoss.find(w => w.status === "lost");
  const pending = data.winLoss.find(w => w.status === "pending");
  const totalSpecs = (won?.count ?? 0) + (lost?.count ?? 0) + (pending?.count ?? 0);
  const winRate = totalSpecs > 0 ? Math.round(((won?.count ?? 0) / (totalSpecs - (pending?.count ?? 0))) * 100) : 0;
  const totalValue = (won?.value ?? 0) + (lost?.value ?? 0) + (pending?.value ?? 0);

  const totalSpecAll = data.marketShare.reduce((s, m) => s + Number(m.count), 0);
  const carrierRow = data.marketShare.find(m => m.name === "Carrier");
  const marketSharePct = totalSpecAll > 0 ? Math.round(((carrierRow?.count ?? 0) / totalSpecAll) * 100) : 0;

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#4A3AFF]/10 flex items-center justify-center">
            <Globe size={16} className="text-[#4A3AFF]" />
          </div>
          <h1 className="text-[#2A2A2F] text-3xl font-bold">Carrier National Dashboard</h1>
        </div>
        <p className="text-[#6C6C71] text-base ml-11">Full market visibility · All regions · All channels</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          label="Spec Win Rate"
          value={`${winRate}%`}
          sub={`${won?.count ?? 0} wins of ${totalSpecs - (pending?.count ?? 0)} decided`}
          icon={Trophy}
          color="green"
          trend={{ value: 3.2, label: "vs last year" }}
        />
        <KpiCard
          label="Market Share"
          value={`${marketSharePct}%`}
          sub={`${carrierRow?.count ?? 0} of ${totalSpecAll} total specs`}
          icon={Target}
          color="blue"
          trend={{ value: 1.8, label: "vs prior year" }}
        />
        <KpiCard
          label="Active Pipeline"
          value={`$${((pending?.value ?? 0) / 1e6).toFixed(1)}M`}
          sub={`${pending?.count ?? 0} pending specs`}
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          label="Total Market Tracked"
          value={`$${(totalValue / 1e6).toFixed(0)}M`}
          sub={`${totalSpecs} spec events logged`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard label="Manufacturers Tracked" value={data.totalMfgs.count} icon={Building2} color="blue" sub="Including Carrier" />
        <KpiCard label="Engineering Firms" value={data.totalFirms.count} icon={Users} color="purple" sub="Active specifiers" />
        <KpiCard label="Channel Partners" value={data.totalSubs.count} icon={Wrench} color="amber" sub="Mechanical subs tracked" />
        <KpiCard label="Sales Reps" value={data.totalReps.count} icon={Globe} color="green" sub="Carrier territory reps" />
      </div>

      {/* Charts Row */}
      <ManufacturerOverviewCharts
        marketShare={data.marketShare.map(m => ({
          name: m.name.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", "").replace(" Electric", ""),
          specs: Number(m.count),
          wins: Number(m.won),
        }))}
        regional={data.regional.map(r => ({
          region: r.region,
          specs: Number(r.count),
          won: Number(r.won),
          value: Number(r.value),
          winRate: r.count > 0 ? Math.round((Number(r.won) / Number(r.count)) * 100) : 0,
        }))}
      />

      {/* Bottom Row: Top Firms + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top BOD Firms */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-8">
          <SectionHeader title="Top Specifying Firms" subtitle="Carrier BOD % (2025) — firms who spec Carrier most" />
          <div className="space-y-4 mt-4">
            {data.topFirms.map((firm, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EDEDED] flex items-center justify-center text-[#6C6C71] text-xs font-mono flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm font-medium truncate">{firm.name}</div>
                  <div className="text-[#6C6C71] text-xs">{firm.city}, {firm.state} · {firm.region}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[#2A2A2F] text-sm font-semibold">{Math.round(Number(firm.bod_pct))}%</div>
                  <div className="text-[#6C6C71] text-xs">{firm.projects} projects</div>
                </div>
                <div className="w-16 h-1.5 bg-[#EDEDED] rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className="h-full bg-[#4A3AFF] rounded-full"
                    style={{ width: `${Math.min(100, Math.round(Number(firm.bod_pct)))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-8">
          <SectionHeader title="Recent Spec Activity" subtitle="Latest projects — Carrier specs nationwide" />
          <div className="space-y-1 mt-4">
            {data.recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-3 py-3 border-b border-[#C9CBCF] last:border-0">
                <StatusBadge value={act.status} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm truncate">{act.project_name}</div>
                  <div className="text-[#6C6C71] text-xs">{act.firm_name} · {act.city} · {act.date}</div>
                </div>
                <div className="text-[#2A2A2F] text-sm font-mono flex-shrink-0">
                  ${((act.value_usd ?? 0) / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
