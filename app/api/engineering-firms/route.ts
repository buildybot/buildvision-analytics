import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { engineering_firms, basis_of_design, spec_activity, manufacturers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const mfgId = parseInt(searchParams.get("manufacturer_id") ?? "1");

  let query = db.select({
    id: engineering_firms.id,
    name: engineering_firms.name,
    city: engineering_firms.city,
    state: engineering_firms.state,
    region: engineering_firms.region,
    size_tier: engineering_firms.size_tier,
    carrier_bod: sql<number>`(select avg(bod_percentage) from basis_of_design where engineering_firm_id = engineering_firms.id and manufacturer_id = ${mfgId} and year = 2025)`,
    total_projects: sql<number>`(select count(*) from spec_activity where engineering_firm_id = engineering_firms.id)`,
    carrier_wins: sql<number>`(select count(*) from spec_activity where engineering_firm_id = engineering_firms.id and manufacturer_id = ${mfgId} and status = 'won')`,
  }).from(engineering_firms);

  const rows = await query;
  const filtered = region ? rows.filter(r => r.region === region) : rows;
  return NextResponse.json(filtered);
}
