import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { spec_activity, engineering_firms, manufacturers, equipment_types } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mfgId = searchParams.get("manufacturer_id");
  const eqTypeId = searchParams.get("equipment_type_id");
  const region = searchParams.get("region");
  const status = searchParams.get("status");
  const firmId = searchParams.get("firm_id");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  const conditions = [];
  if (mfgId) conditions.push(eq(spec_activity.manufacturer_id, parseInt(mfgId)));
  if (eqTypeId) conditions.push(eq(spec_activity.equipment_type_id, parseInt(eqTypeId)));
  if (region) conditions.push(eq(spec_activity.region, region));
  if (status) conditions.push(eq(spec_activity.status, status));
  if (firmId) conditions.push(eq(spec_activity.engineering_firm_id, parseInt(firmId)));

  const rows = await db.select({
    id: spec_activity.id,
    project_name: spec_activity.project_name,
    status: spec_activity.status,
    region: spec_activity.region,
    city: spec_activity.city,
    state: spec_activity.state,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    manufacturer_id: spec_activity.manufacturer_id,
    manufacturer_name: manufacturers.name,
    engineering_firm_id: spec_activity.engineering_firm_id,
    firm_name: engineering_firms.name,
    equipment_type_id: spec_activity.equipment_type_id,
    equipment_type_name: equipment_types.name,
  }).from(spec_activity)
    .innerJoin(manufacturers, eq(spec_activity.manufacturer_id, manufacturers.id))
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .innerJoin(equipment_types, eq(spec_activity.equipment_type_id, equipment_types.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`date desc`)
    .limit(limit);

  return NextResponse.json(rows);
}
