import { db } from "@/db/client";
import { rep_subcontractor_relationships, subcontractors, equipment_types } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Wrench, DollarSign, Users } from "lucide-react";

const REP_ID = 1;

async function getSubData() {
  const rels = await db.select({
    id: rep_subcontractor_relationships.id,
    sub_id: rep_subcontractor_relationships.subcontractor_id,
    sub_name: subcontractors.name,
    specialty: subcontractors.specialty,
    sub_city: subcontractors.city,
    sub_state: subcontractors.state,
    size_tier: subcontractors.size_tier,
    annual_volume_usd: rep_subcontractor_relationships.annual_volume_usd,
    project_count: rep_subcontractor_relationships.project_count,
    relationship_strength: rep_subcontractor_relationships.relationship_strength,
    eq_name: equipment_types.name,
  }).from(rep_subcontractor_relationships)
    .innerJoin(subcontractors, eq(rep_subcontractor_relationships.subcontractor_id, subcontractors.id))
    .innerJoin(equipment_types, eq(rep_subcontractor_relationships.equipment_type_id, equipment_types.id))
    .where(eq(rep_subcontractor_relationships.rep_id, REP_ID))
    .orderBy(sql`annual_volume_usd desc`);

  return rels;
}

export default async function RepSubcontractorsPage() {
  const rels = await getSubData();

  // Aggregate by sub
  const subAgg: { [name: string]: { specialty: string; city: string; state: string; size_tier: string; strength: string; totalVol: number; totalProj: number; eqTypes: string[] } } = {};
  for (const r of rels) {
    if (!subAgg[r.sub_name]) {
      subAgg[r.sub_name] = { specialty: r.specialty, city: r.sub_city ?? "", state: r.sub_state ?? "", size_tier: r.size_tier, strength: r.relationship_strength, totalVol: 0, totalProj: 0, eqTypes: [] };
    }
    subAgg[r.sub_name].totalVol += Number(r.annual_volume_usd ?? 0);
    subAgg[r.sub_name].totalProj += Number(r.project_count ?? 0);
    const eq = r.eq_name?.replace("Chiller — ", "").replace("VRF / VRV System", "VRF") ?? "";
    if (!subAgg[r.sub_name].eqTypes.includes(eq)) subAgg[r.sub_name].eqTypes.push(eq);
    if (r.relationship_strength === "primary") subAgg[r.sub_name].strength = "primary";
  }
  const subs = Object.entries(subAgg).sort((a, b) => b[1].totalVol - a[1].totalVol);
  const totalVol = subs.reduce((s, [, d]) => s + d.totalVol, 0);
  const totalProj = subs.reduce((s, [, d]) => s + d.totalProj, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#2A2A2F] text-xl font-bold">My Subcontractors</h1>
        <p className="text-[#6C6C71] text-sm">Mechanical subs in my territory — Carrier equipment relationships</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Sub Relationships" value={subs.length} sub="Unique subs in my territory" icon={Wrench} color="blue" />
        <KpiCard label="Total Annual Volume" value={`$${(totalVol / 1e6).toFixed(1)}M`} sub="Carrier equipment via my subs" icon={DollarSign} color="green" />
        <KpiCard label="Total Projects" value={totalProj} sub="Projects through sub channel" icon={Users} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subs.map(([name, data], i) => (
          <div key={i} className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[#2A2A2F] font-semibold text-sm">{name}</div>
                <div className="text-[#6C6C71] text-xs mt-0.5">{data.city}, {data.state}</div>
              </div>
              <StatusBadge value={data.strength} />
            </div>
            <div className="flex gap-2 mb-3 flex-wrap">
              <StatusBadge value={data.specialty} />
              <StatusBadge value={data.size_tier} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-[#2A2A2F] font-bold">${(data.totalVol / 1e6).toFixed(2)}M</div>
                <div className="text-[#6C6C71] text-xs">Annual Vol</div>
              </div>
              <div>
                <div className="text-[#2A2A2F] font-bold">{data.totalProj}</div>
                <div className="text-[#6C6C71] text-xs">Projects</div>
              </div>
            </div>
            {data.eqTypes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#C9CBCF] text-[#6C6C71] text-xs">
                {data.eqTypes.slice(0, 3).join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
