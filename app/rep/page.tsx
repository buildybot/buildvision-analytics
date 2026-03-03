import { db } from "@/db/client";
import { rep_territories, rep_permissions, spec_activity, basis_of_design, engineering_firms, manufacturers, equipment_types, rep_subcontractor_relationships, subcontractors } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { RestrictedBlock } from "@/components/ui/restricted-badge";
import { Trophy, TrendingUp, Wrench, Building2, User } from "lucide-react";

// Marcus Chen — rep ID 1, Northeast
const REP_ID = 1;
const CARRIER_ID = 1;
const REP_REGION = "Northeast";

async function getRepData() {
  const [rep] = await db.select().from(rep_territories).where(eq(rep_territories.id, REP_ID));
  const [perms] = await db.select().from(rep_permissions).where(and(
    eq(rep_permissions.rep_id, REP_ID),
    eq(rep_permissions.manufacturer_id, CARRIER_ID)
  ));

  // Spec activity in my region
  const mySpecs = await db.select({
    id: spec_activity.id,
    project_name: spec_activity.project_name,
    status: spec_activity.status,
    city: spec_activity.city,
    state: spec_activity.state,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    firm_name: engineering_firms.name,
    eq_name: equipment_types.name,
    mfg_name: manufacturers.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .innerJoin(equipment_types, eq(spec_activity.equipment_type_id, equipment_types.id))
    .innerJoin(manufacturers, eq(spec_activity.manufacturer_id, manufacturers.id))
    .where(and(
      eq(spec_activity.region, REP_REGION),
      eq(spec_activity.manufacturer_id, CARRIER_ID)
    ))
    .orderBy(sql`date desc`)
    .limit(12);

  // My top firms BOD
  const myFirmBOD = await db.select({
    firm_name: engineering_firms.name,
    firm_city: engineering_firms.city,
    bod_pct: sql<number>`avg(bod_percentage)`,
    projects: sql<number>`sum(project_count)`,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .where(and(
      eq(basis_of_design.manufacturer_id, CARRIER_ID),
      eq(basis_of_design.region, REP_REGION),
      eq(basis_of_design.year, 2025)
    ))
    .groupBy(engineering_firms.id, engineering_firms.name, engineering_firms.city)
    .orderBy(sql`avg(bod_percentage) desc`)
    .limit(8);

  // My subs
  const mySubs = await db.select({
    sub_name: subcontractors.name,
    specialty: subcontractors.specialty,
    annual_volume_usd: rep_subcontractor_relationships.annual_volume_usd,
    project_count: rep_subcontractor_relationships.project_count,
    relationship_strength: rep_subcontractor_relationships.relationship_strength,
  }).from(rep_subcontractor_relationships)
    .innerJoin(subcontractors, eq(rep_subcontractor_relationships.subcontractor_id, subcontractors.id))
    .where(eq(rep_subcontractor_relationships.rep_id, REP_ID))
    .orderBy(sql`annual_volume_usd desc`)
    .limit(8);

  // Competitor BOD threats in my region
  const compThreats = await db.select({
    firm_name: engineering_firms.name,
    mfg_name: manufacturers.name,
    bod_pct: sql<number>`avg(bod_percentage)`,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(manufacturers, eq(basis_of_design.manufacturer_id, manufacturers.id))
    .where(and(
      eq(basis_of_design.region, REP_REGION),
      eq(basis_of_design.year, 2025),
      sql`manufacturer_id != ${CARRIER_ID}`,
      sql`bod_percentage > 30`
    ))
    .groupBy(engineering_firms.name, manufacturers.name)
    .orderBy(sql`avg(bod_percentage) desc`)
    .limit(6);

  const won = mySpecs.filter(s => s.status === "won");
  const lost = mySpecs.filter(s => s.status === "lost");
  const pending = mySpecs.filter(s => s.status === "pending");

  return { rep, perms, mySpecs, myFirmBOD, mySubs, compThreats, won, lost, pending };
}

export default async function RepDashboardPage() {
  const data = await getRepData();
  const decided = data.won.length + data.lost.length;
  const winRate = decided > 0 ? Math.round((data.won.length / decided) * 100) : 0;
  const pipelineValue = data.pending.reduce((s, s2) => s + (s2.value_usd ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#4A3AFF]/20 border border-[#4A3AFF]/40 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-[#4A3AFF]" />
        </div>
        <div>
          <h1 className="text-[#2A2A2F] text-xl font-bold">Marcus Chen — Northeast</h1>
          <p className="text-[#6C6C71] text-sm">Carrier rep · New York, NY · Territory dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Win Rate" value={`${winRate}%`} sub={`${data.won.length}W / ${data.lost.length}L in region`} icon={Trophy} color="green" />
        <KpiCard label="Pipeline Value" value={`$${(pipelineValue / 1e6).toFixed(1)}M`} sub={`${data.pending.length} pending specs`} icon={TrendingUp} color="amber" />
        <KpiCard label="Active Firms" value={data.myFirmBOD.length} sub="Northeast firms I track" icon={Building2} color="blue" />
        <KpiCard label="Sub Relationships" value={data.mySubs.length} sub="Mechanical subs in my territory" icon={Wrench} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Specs */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
          <SectionHeader title="My Spec Activity" subtitle="Carrier specs in Northeast" />
          <div className="space-y-2">
            {data.mySpecs.map((spec) => (
              <div key={spec.id} className="flex items-start gap-3 py-1.5 border-b border-[#C9CBCF] last:border-0">
                <StatusBadge value={spec.status} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm truncate">{spec.project_name}</div>
                  <div className="text-[#6C6C71] text-xs">{spec.firm_name} · {spec.city} · {spec.eq_name?.replace("Chiller — ", "").replace("VRF / VRV System", "VRF")}</div>
                </div>
                <div className="text-[#2A2A2F] text-sm font-mono flex-shrink-0">${((spec.value_usd ?? 0) / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </div>

        {/* My Firms BOD */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
          <SectionHeader title="My Engineering Firms" subtitle="Carrier BOD% at my accounts (2025)" />
          <div className="space-y-2.5">
            {data.myFirmBOD.map((firm, i) => {
              const pct = Math.round(Number(firm.bod_pct));
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[#2A2A2F] text-sm font-medium">{firm.firm_name}</div>
                    <div className="text-[#6C6C71] text-xs">{firm.firm_city} · {firm.projects} projects</div>
                  </div>
                  <div className="w-20 h-1.5 bg-[#EDEDED] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 35 ? "#16DA7C" : pct >= 20 ? "#4A3AFF" : "#f59e0b" }} />
                  </div>
                  <span className={`text-sm font-mono font-semibold flex-shrink-0 ${pct >= 35 ? "text-emerald-400" : pct >= 20 ? "text-[#4A3AFF]" : "text-amber-400"}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Opportunities + Subs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comp threats = my opportunities */}
        <div className="bg-[#F8F8F8] border border-amber-400/20 rounded-xl p-5">
          <SectionHeader title="🎯 My Opportunities" subtitle="Northeast firms where a competitor has high BOD — your targets" />
          <div className="space-y-2">
            {data.compThreats.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#C9CBCF] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm font-medium">{t.firm_name}</div>
                  <div className="text-amber-400 text-xs">{t.mfg_name?.replace(" Technologies", "")} holds {Math.round(Number(t.bod_pct))}% BOD</div>
                </div>
                <div className="text-amber-400 text-xs font-medium">Opportunity →</div>
              </div>
            ))}
          </div>
        </div>

        {/* My Subs */}
        <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
          <SectionHeader title="My Subcontractors" subtitle="Channel partners in my territory" />
          <div className="space-y-2">
            {data.mySubs.map((sub, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#C9CBCF] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[#2A2A2F] text-sm font-medium">{sub.sub_name}</div>
                  <div className="text-[#6C6C71] text-xs">{sub.specialty?.replace("_", " ")} · {sub.project_count} projects</div>
                </div>
                <StatusBadge value={sub.relationship_strength} />
                <div className="text-[#2A2A2F] text-sm font-mono">${((sub.annual_volume_usd ?? 0) / 1e6).toFixed(2)}M</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
