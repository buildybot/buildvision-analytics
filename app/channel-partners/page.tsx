import { db } from "@/db/client";
import { subcontractors, rep_subcontractor_relationships, rep_territories, rep_permissions, equipment_types } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RestrictedBlock } from "@/components/ui/restricted-badge";
import { ChannelPartnersCharts } from "@/components/charts/ChannelPartnersCharts";
import { Wrench, DollarSign, Users, Lock } from "lucide-react";

const CARRIER_ID = 1;
const MARCUS_REP_ID = 1; // Marcus Chen — full share

async function getChannelData() {
  // Get all reps + permissions
  const reps = await db.select().from(rep_territories).where(eq(rep_territories.manufacturer_id, CARRIER_ID));
  const perms = await db.select().from(rep_permissions).where(eq(rep_permissions.manufacturer_id, CARRIER_ID));
  const permMap: { [repId: number]: typeof perms[0] } = {};
  perms.forEach(p => { permMap[p.rep_id] = p; });

  // Region-level restriction summary
  const regionRestrictions: { [region: string]: { total: number; restricted: number; reps: string[] } } = {};
  for (const rep of reps) {
    const r = rep.region;
    if (!regionRestrictions[r]) regionRestrictions[r] = { total: 0, restricted: 0, reps: [] };
    regionRestrictions[r].total++;
    const perm = permMap[rep.id];
    if (!perm?.share_subcontractors) {
      regionRestrictions[r].restricted++;
    } else {
      regionRestrictions[r].reps.push(rep.rep_name);
    }
  }

  // Build visible sub data (only from reps who share)
  const visibleReps = reps.filter(r => permMap[r.id]?.share_subcontractors !== false);
  const restrictedReps = reps.filter(r => permMap[r.id]?.share_subcontractors === false);

  let allRels: {
    sub_id: number; sub_name: string; sub_region: string; specialty: string;
    size_tier: string; annual_volume_usd: number | null; project_count: number | null;
    relationship_strength: string; rep_name: string; rep_region: string; eq_type_id: number;
  }[] = [];

  for (const rep of visibleReps) {
    const rels = await db.select({
      sub_id: rep_subcontractor_relationships.subcontractor_id,
      sub_name: subcontractors.name,
      sub_region: subcontractors.region,
      specialty: subcontractors.specialty,
      size_tier: subcontractors.size_tier,
      sub_city: subcontractors.city,
      sub_state: subcontractors.state,
      annual_volume_usd: rep_subcontractor_relationships.annual_volume_usd,
      project_count: rep_subcontractor_relationships.project_count,
      relationship_strength: rep_subcontractor_relationships.relationship_strength,
      eq_type_id: rep_subcontractor_relationships.equipment_type_id,
    }).from(rep_subcontractor_relationships)
      .innerJoin(subcontractors, eq(rep_subcontractor_relationships.subcontractor_id, subcontractors.id))
      .where(and(
        eq(rep_subcontractor_relationships.rep_id, rep.id),
        eq(rep_subcontractor_relationships.manufacturer_id, CARRIER_ID)
      ));
    for (const rel of rels) {
      allRels.push({ ...rel, rep_name: rep.rep_name, rep_region: rep.region });
    }
  }

  // Aggregate by subcontractor
  const subAgg: { [subId: number]: {
    sub_name: string; sub_region: string; specialty: string; size_tier: string;
    total_volume: number; total_projects: number; reps: string[];
    primary_strength: string;
  }} = {};
  for (const r of allRels) {
    if (!subAgg[r.sub_id]) {
      subAgg[r.sub_id] = {
        sub_name: r.sub_name, sub_region: r.sub_region, specialty: r.specialty,
        size_tier: r.size_tier, total_volume: 0, total_projects: 0, reps: [], primary_strength: r.relationship_strength,
      };
    }
    subAgg[r.sub_id].total_volume += Number(r.annual_volume_usd ?? 0);
    subAgg[r.sub_id].total_projects += Number(r.project_count ?? 0);
    if (!subAgg[r.sub_id].reps.includes(r.rep_name)) subAgg[r.sub_id].reps.push(r.rep_name);
    if (r.relationship_strength === "primary") subAgg[r.sub_id].primary_strength = "primary";
  }
  const aggregated = Object.entries(subAgg)
    .map(([id, d]) => ({ id: parseInt(id), ...d }))
    .sort((a, b) => b.total_volume - a.total_volume);

  const totalVolume = aggregated.reduce((s, r) => s + r.total_volume, 0);
  const totalProjects = aggregated.reduce((s, r) => s + r.total_projects, 0);

  // Volume by specialty
  const bySpecialty: { [s: string]: number } = {};
  for (const r of aggregated) {
    if (!bySpecialty[r.specialty]) bySpecialty[r.specialty] = 0;
    bySpecialty[r.specialty] += r.total_volume;
  }

  // Volume by region
  const byRegion: { [r: string]: number } = {};
  for (const r of aggregated) {
    if (!byRegion[r.sub_region]) byRegion[r.sub_region] = 0;
    byRegion[r.sub_region] += r.total_volume;
  }

  return {
    aggregated,
    restrictedReps,
    regionRestrictions,
    totalVolume,
    totalProjects,
    bySpecialty,
    byRegion,
    visibleCount: visibleReps.length,
    restrictedCount: restrictedReps.length,
  };
}

export default async function ChannelPartnersPage() {
  const data = await getChannelData();

  const specialtyChartData = Object.entries(data.bySpecialty)
    .map(([name, volume]) => ({ name: name.replace("_", " "), volume }))
    .sort((a, b) => b.volume - a.volume);

  const regionChartData = Object.entries(data.byRegion)
    .map(([region, volume]) => ({ region, volume }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#2A2A2F] text-2xl font-bold">Channel Partners</h1>
        <p className="text-[#6C6C71] text-sm mb-8">Carrier's mechanical sub network — who buys, how much, where</p>
      </div>

      {/* Permission summary banner */}
      {data.restrictedCount > 0 && (
        <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Lock size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-amber-400 font-medium text-sm">Partial data visibility</div>
              <div className="text-[#6C6C71] text-sm mt-1">
                {data.restrictedCount} of {data.visibleCount + data.restrictedCount} reps have restricted subcontractor sharing.
                The data below reflects <strong className="text-[#2A2A2F]">{data.visibleCount} reps</strong> who have shared.
                {Object.entries(data.regionRestrictions).map(([region, counts]) =>
                  counts.restricted > 0 ? (
                    <span key={region} className="ml-2 text-amber-400/80">
                      {counts.restricted} sub{counts.restricted > 1 ? "s" : ""} restricted in {region}.
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Visible Sub Relationships" value={data.aggregated.length} sub={`From ${data.visibleCount} sharing reps`} icon={Wrench} color="blue" />
        <KpiCard label="Total Annual Volume" value={`$${(data.totalVolume / 1e6).toFixed(1)}M`} sub="Carrier equipment through subs" icon={DollarSign} color="green" />
        <KpiCard label="Total Projects" value={data.totalProjects} sub="Carrier specs via sub channel" icon={Users} color="amber" />
        <KpiCard label="Data Restricted" value={`${data.restrictedCount} rep${data.restrictedCount !== 1 ? "s" : ""}`} sub="Not sharing sub data with Carrier" icon={Lock} color="red" />
      </div>

      <ChannelPartnersCharts
        bySpecialty={specialtyChartData}
        byRegion={regionChartData}
      />

      {/* Restricted region callouts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {Object.entries(data.regionRestrictions).map(([region, counts]) => (
          <div key={region} className={`rounded-xl border p-5 ${counts.restricted > 0 ? "bg-amber-400/5 border-amber-400/20" : "bg-emerald-400/5 border-emerald-400/20"}`}>
            <div className="text-[#2A2A2F] font-medium text-sm">{region}</div>
            <div className={`text-xs mt-1 ${counts.restricted > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {counts.restricted > 0 ? `${counts.restricted}/${counts.total} reps restricted` : "Full visibility"}
            </div>
            {counts.reps.length > 0 && (
              <div className="text-[#6C6C71] text-xs mt-1">{counts.reps.join(", ")}</div>
            )}
          </div>
        ))}
      </div>

      {/* Sub table */}
      <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
        <SectionHeader
          title="Subcontractor Network"
          subtitle="Carrier equipment volume by sub — sorted by annual volume"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDEDED] bg-[#F8F8F8]">
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Subcontractor</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Region</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Specialty</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Strength</th>
                <th className="text-right text-[#6C6C71] font-medium px-5 py-3">Annual Volume</th>
                <th className="text-right text-[#6C6C71] font-medium px-5 py-3">Projects</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Reps</th>
              </tr>
            </thead>
            <tbody>
              {data.aggregated.map((sub, i) => (
                <tr key={i} className={`border-b border-[#EDEDED] last:border-0 hover:bg-[#EDEDED]/50 transition-colors ${i % 2 === 1 ? "bg-[#F8F8F8]" : ""}`}>
                  <td className="px-5 py-3.5 text-[#2A2A2F] font-medium">{sub.sub_name}</td>
                  <td className="px-5 py-3.5 text-[#6C6C71]">{sub.sub_region}</td>
                  <td className="px-5 py-3.5"><StatusBadge value={sub.specialty} /></td>
                  <td className="px-5 py-3.5"><StatusBadge value={sub.primary_strength} /></td>
                  <td className="px-5 py-3.5 text-right font-mono text-[#2A2A2F]">${(sub.total_volume / 1e6).toFixed(2)}M</td>
                  <td className="px-5 py-3.5 text-right font-mono text-[#6C6C71]">{sub.total_projects}</td>
                  <td className="px-5 py-3.5 text-[#6C6C71] text-xs">{sub.reps.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
