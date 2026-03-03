import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { subcontractors, rep_subcontractor_relationships, rep_territories, rep_permissions, manufacturers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mfgId = parseInt(searchParams.get("manufacturer_id") ?? "1");
  const region = searchParams.get("region");
  const repId = searchParams.get("rep_id");

  // Get permissions for all reps for this mfg
  const permissions = await db.select().from(rep_permissions).where(eq(rep_permissions.manufacturer_id, mfgId));
  const permMap: { [repId: number]: typeof permissions[0] } = {};
  permissions.forEach(p => { permMap[p.rep_id] = p; });

  // Get all reps for this mfg
  const reps = await db.select().from(rep_territories).where(eq(rep_territories.manufacturer_id, mfgId));

  if (repId) {
    // Rep view — show their specific sub relationships
    const repIdInt = parseInt(repId);
    const rels = await db.select({
      id: rep_subcontractor_relationships.id,
      subcontractor_id: rep_subcontractor_relationships.subcontractor_id,
      sub_name: subcontractors.name,
      sub_city: subcontractors.city,
      sub_state: subcontractors.state,
      sub_region: subcontractors.region,
      specialty: subcontractors.specialty,
      size_tier: subcontractors.size_tier,
      annual_volume_usd: rep_subcontractor_relationships.annual_volume_usd,
      project_count: rep_subcontractor_relationships.project_count,
      relationship_strength: rep_subcontractor_relationships.relationship_strength,
      equipment_type_id: rep_subcontractor_relationships.equipment_type_id,
      year: rep_subcontractor_relationships.year,
    }).from(rep_subcontractor_relationships)
      .innerJoin(subcontractors, eq(rep_subcontractor_relationships.subcontractor_id, subcontractors.id))
      .where(eq(rep_subcontractor_relationships.rep_id, repIdInt));
    return NextResponse.json({ type: "rep", relationships: rels });
  }

  // Manufacturer view — aggregate with permission gating
  const result = [];
  const regionCounts: { [region: string]: { total: number; restricted: number } } = {};

  for (const rep of reps) {
    const perm = permMap[rep.id];
    const sharesData = perm?.share_subcontractors !== false;
    const repRegion = rep.region;

    if (!regionCounts[repRegion]) regionCounts[repRegion] = { total: 0, restricted: 0 };
    regionCounts[repRegion].total++;

    if (!sharesData) {
      regionCounts[repRegion].restricted++;
      continue;
    }

    const rels = await db.select({
      subcontractor_id: rep_subcontractor_relationships.subcontractor_id,
      sub_name: subcontractors.name,
      sub_city: subcontractors.city,
      sub_state: subcontractors.state,
      sub_region: subcontractors.region,
      specialty: subcontractors.specialty,
      size_tier: subcontractors.size_tier,
      annual_volume_usd: rep_subcontractor_relationships.annual_volume_usd,
      project_count: rep_subcontractor_relationships.project_count,
      relationship_strength: rep_subcontractor_relationships.relationship_strength,
      equipment_type_id: rep_subcontractor_relationships.equipment_type_id,
    }).from(rep_subcontractor_relationships)
      .innerJoin(subcontractors, eq(rep_subcontractor_relationships.subcontractor_id, subcontractors.id))
      .where(and(
        eq(rep_subcontractor_relationships.rep_id, rep.id),
        eq(rep_subcontractor_relationships.manufacturer_id, mfgId)
      ));

    for (const rel of rels) {
      result.push({ ...rel, rep_name: rep.rep_name, rep_region: rep.region });
    }
  }

  // Aggregate by subcontractor
  const subAgg: { [subId: number]: { sub_name: string; sub_region: string; specialty: string; size_tier: string; total_volume: number; total_projects: number; reps: string[]; relationship_strength: string } } = {};
  for (const r of result) {
    if (!subAgg[r.subcontractor_id]) {
      subAgg[r.subcontractor_id] = {
        sub_name: r.sub_name,
        sub_region: r.sub_region,
        specialty: r.specialty,
        size_tier: r.size_tier,
        total_volume: 0,
        total_projects: 0,
        reps: [],
        relationship_strength: r.relationship_strength,
      };
    }
    subAgg[r.subcontractor_id].total_volume += r.annual_volume_usd ?? 0;
    subAgg[r.subcontractor_id].total_projects += r.project_count ?? 0;
    if (!subAgg[r.subcontractor_id].reps.includes(r.rep_name)) {
      subAgg[r.subcontractor_id].reps.push(r.rep_name);
    }
  }

  const aggregated = Object.entries(subAgg).map(([id, data]) => ({ id: parseInt(id), ...data }));
  const filtered = region ? aggregated.filter(s => s.sub_region === region) : aggregated;

  return NextResponse.json({
    type: "manufacturer",
    subcontractors: filtered.sort((a, b) => b.total_volume - a.total_volume),
    regionRestrictions: Object.entries(regionCounts).map(([r, counts]) => ({
      region: r,
      total_reps: counts.total,
      restricted_reps: counts.restricted,
    })),
  });
}
