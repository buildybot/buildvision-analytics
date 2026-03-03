import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { rep_permissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repId = parseInt(searchParams.get("rep_id") ?? "0");
  const mfgId = parseInt(searchParams.get("manufacturer_id") ?? "1");

  const [row] = await db.select().from(rep_permissions)
    .where(and(eq(rep_permissions.rep_id, repId), eq(rep_permissions.manufacturer_id, mfgId)));

  return NextResponse.json(row ?? null);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { rep_id, manufacturer_id, ...updates } = body;

  await db.update(rep_permissions)
    .set({ ...updates, updated_at: new Date().toISOString() })
    .where(and(
      eq(rep_permissions.rep_id, rep_id),
      eq(rep_permissions.manufacturer_id, manufacturer_id)
    ));

  const [row] = await db.select().from(rep_permissions)
    .where(and(eq(rep_permissions.rep_id, rep_id), eq(rep_permissions.manufacturer_id, manufacturer_id)));

  return NextResponse.json(row);
}
