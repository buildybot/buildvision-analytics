import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { basis_of_design, engineering_firms, manufacturers, equipment_types } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eqTypeId = searchParams.get("equipment_type_id");
  const region = searchParams.get("region");
  const year = searchParams.get("year") ?? "2025";
  const mfgId = searchParams.get("manufacturer_id");
  const firmId = searchParams.get("firm_id");

  const conditions = [];
  if (eqTypeId) conditions.push(eq(basis_of_design.equipment_type_id, parseInt(eqTypeId)));
  if (region) conditions.push(eq(basis_of_design.region, region));
  if (year) conditions.push(eq(basis_of_design.year, parseInt(year)));
  if (mfgId) conditions.push(eq(basis_of_design.manufacturer_id, parseInt(mfgId)));
  if (firmId) conditions.push(eq(basis_of_design.engineering_firm_id, parseInt(firmId)));

  const rows = await db.select({
    id: basis_of_design.id,
    engineering_firm_id: basis_of_design.engineering_firm_id,
    firm_name: engineering_firms.name,
    firm_city: engineering_firms.city,
    firm_state: engineering_firms.state,
    firm_region: engineering_firms.region,
    manufacturer_id: basis_of_design.manufacturer_id,
    manufacturer_name: manufacturers.name,
    equipment_type_id: basis_of_design.equipment_type_id,
    equipment_type_name: equipment_types.name,
    bod_percentage: basis_of_design.bod_percentage,
    project_count: basis_of_design.project_count,
    year: basis_of_design.year,
    region: basis_of_design.region,
  }).from(basis_of_design)
    .innerJoin(engineering_firms, eq(basis_of_design.engineering_firm_id, engineering_firms.id))
    .innerJoin(manufacturers, eq(basis_of_design.manufacturer_id, manufacturers.id))
    .innerJoin(equipment_types, eq(basis_of_design.equipment_type_id, equipment_types.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`bod_percentage desc`);

  return NextResponse.json(rows);
}
