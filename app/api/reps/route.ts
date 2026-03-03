import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { rep_territories, rep_permissions, spec_activity, manufacturers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mfgId = parseInt(searchParams.get("manufacturer_id") ?? "1");

  const reps = await db.select().from(rep_territories).where(eq(rep_territories.manufacturer_id, mfgId));
  const perms = await db.select().from(rep_permissions).where(eq(rep_permissions.manufacturer_id, mfgId));
  const permMap: { [repId: number]: typeof perms[0] } = {};
  perms.forEach(p => { permMap[p.rep_id] = p; });

  const result = reps.map(rep => ({
    ...rep,
    permissions: permMap[rep.id] ?? null,
  }));

  return NextResponse.json(result);
}
