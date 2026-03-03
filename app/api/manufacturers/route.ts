import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { manufacturers, spec_activity, basis_of_design } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db.select({
    id: manufacturers.id,
    name: manufacturers.name,
    hq_city: manufacturers.hq_city,
    hq_state: manufacturers.hq_state,
    annual_revenue: manufacturers.annual_revenue,
    spec_count: sql<number>`(select count(*) from spec_activity where manufacturer_id = manufacturers.id)`,
    win_count: sql<number>`(select count(*) from spec_activity where manufacturer_id = manufacturers.id and status = 'won')`,
    avg_bod: sql<number>`(select avg(bod_percentage) from basis_of_design where manufacturer_id = manufacturers.id)`,
  }).from(manufacturers).orderBy(manufacturers.annual_revenue);

  return NextResponse.json(rows.reverse());
}
