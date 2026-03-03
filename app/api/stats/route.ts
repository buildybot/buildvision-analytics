import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { manufacturers, spec_activity, basis_of_design, equipment_pricing, engineering_firms, subcontractors, rep_territories } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mfgId = parseInt(searchParams.get("manufacturer_id") ?? "1");

  const [totalMfgs] = await db.select({ count: sql<number>`count(*)` }).from(manufacturers);
  const [totalFirms] = await db.select({ count: sql<number>`count(*)` }).from(engineering_firms);
  const [totalSubs] = await db.select({ count: sql<number>`count(*)` }).from(subcontractors);
  const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(rep_territories).where(eq(rep_territories.manufacturer_id, mfgId));

  // Win/Loss for this manufacturer
  const winLoss = await db.select({
    status: spec_activity.status,
    count: sql<number>`count(*)`,
    value: sql<number>`sum(value_usd)`,
  }).from(spec_activity)
    .where(eq(spec_activity.manufacturer_id, mfgId))
    .groupBy(spec_activity.status);

  // Market share by spec count (all mfgs)
  const marketShare = await db.select({
    manufacturer_id: spec_activity.manufacturer_id,
    name: manufacturers.name,
    count: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
  }).from(spec_activity)
    .innerJoin(manufacturers, eq(spec_activity.manufacturer_id, manufacturers.id))
    .groupBy(spec_activity.manufacturer_id, manufacturers.name)
    .orderBy(sql`count(*) desc`);

  // Average BOD % for this manufacturer
  const [avgBOD] = await db.select({
    avg_bod: sql<number>`avg(bod_percentage)`,
  }).from(basis_of_design).where(eq(basis_of_design.manufacturer_id, mfgId));

  // Average price per ton for chillers
  const [avgPricing] = await db.select({
    avg_price: sql<number>`avg(price_usd / size_value)`,
  }).from(equipment_pricing)
    .where(and(
      eq(equipment_pricing.manufacturer_id, mfgId),
      eq(equipment_pricing.size_unit, "tons")
    ));

  // Regional spec counts for this mfg
  const regionalBreakdown = await db.select({
    region: spec_activity.region,
    count: sql<number>`count(*)`,
    won: sql<number>`sum(case when status='won' then 1 else 0 end)`,
    value: sql<number>`sum(value_usd)`,
  }).from(spec_activity)
    .where(eq(spec_activity.manufacturer_id, mfgId))
    .groupBy(spec_activity.region);

  // Recent activity
  const recentActivity = await db.select({
    id: spec_activity.id,
    project_name: spec_activity.project_name,
    status: spec_activity.status,
    region: spec_activity.region,
    city: spec_activity.city,
    state: spec_activity.state,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    firm_name: engineering_firms.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .where(eq(spec_activity.manufacturer_id, mfgId))
    .orderBy(sql`date desc`)
    .limit(10);

  return NextResponse.json({
    totals: {
      manufacturers: totalMfgs.count,
      engineering_firms: totalFirms.count,
      subcontractors: totalSubs.count,
      reps: totalReps.count,
    },
    winLoss,
    marketShare,
    avgBOD: avgBOD?.avg_bod ?? 0,
    avgPricingPerUnit: avgPricing?.avg_price ?? 0,
    regionalBreakdown,
    recentActivity,
  });
}
