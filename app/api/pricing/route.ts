import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { equipment_pricing, manufacturers, equipment_types } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mfgId = searchParams.get("manufacturer_id");
  const eqTypeId = searchParams.get("equipment_type_id");
  const region = searchParams.get("region");
  const year = searchParams.get("year");
  const aggregate = searchParams.get("aggregate"); // returns avg $/unit by mfg

  const conditions = [];
  if (mfgId) conditions.push(eq(equipment_pricing.manufacturer_id, parseInt(mfgId)));
  if (eqTypeId) conditions.push(eq(equipment_pricing.equipment_type_id, parseInt(eqTypeId)));
  if (region) conditions.push(eq(equipment_pricing.region, region));
  if (year) conditions.push(eq(equipment_pricing.year, parseInt(year)));

  if (aggregate === "true") {
    const rows = await db.select({
      manufacturer_id: equipment_pricing.manufacturer_id,
      manufacturer_name: manufacturers.name,
      equipment_type_id: equipment_pricing.equipment_type_id,
      equipment_type_name: equipment_types.name,
      size_unit: equipment_pricing.size_unit,
      avg_price_per_unit: sql<number>`avg(price_usd / size_value)`,
      avg_size: sql<number>`avg(size_value)`,
      count: sql<number>`count(*)`,
      year: equipment_pricing.year,
      region: equipment_pricing.region,
    }).from(equipment_pricing)
      .innerJoin(manufacturers, eq(equipment_pricing.manufacturer_id, manufacturers.id))
      .innerJoin(equipment_types, eq(equipment_pricing.equipment_type_id, equipment_types.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        equipment_pricing.manufacturer_id,
        manufacturers.name,
        equipment_pricing.equipment_type_id,
        equipment_types.name,
        equipment_pricing.size_unit,
        equipment_pricing.year,
        equipment_pricing.region
      )
      .orderBy(sql`avg(price_usd / size_value) asc`);
    return NextResponse.json(rows);
  }

  const rows = await db.select({
    id: equipment_pricing.id,
    manufacturer_id: equipment_pricing.manufacturer_id,
    manufacturer_name: manufacturers.name,
    equipment_type_id: equipment_pricing.equipment_type_id,
    equipment_type_name: equipment_types.name,
    model_name: equipment_pricing.model_name,
    size_value: equipment_pricing.size_value,
    size_unit: equipment_pricing.size_unit,
    price_usd: equipment_pricing.price_usd,
    price_per_unit: sql<number>`price_usd / size_value`,
    region: equipment_pricing.region,
    year: equipment_pricing.year,
  }).from(equipment_pricing)
    .innerJoin(manufacturers, eq(equipment_pricing.manufacturer_id, manufacturers.id))
    .innerJoin(equipment_types, eq(equipment_pricing.equipment_type_id, equipment_types.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(equipment_pricing.year, equipment_pricing.manufacturer_id)
    .limit(500);

  return NextResponse.json(rows);
}
