import { db } from "@/db/client";
import { rep_permissions, rep_territories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PermissionsPanel } from "@/components/rep/PermissionsPanel";
import { Shield } from "lucide-react";

const REP_ID = 1;
const CARRIER_ID = 1;

async function getPermissions() {
  const [rep] = await db.select().from(rep_territories).where(eq(rep_territories.id, REP_ID));
  const [perms] = await db.select().from(rep_permissions).where(and(
    eq(rep_permissions.rep_id, REP_ID),
    eq(rep_permissions.manufacturer_id, CARRIER_ID)
  ));
  return { rep, perms };
}

export default async function RepSettingsPage() {
  const { rep, perms } = await getPermissions();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#0066ff]/20 flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-[#0066ff]" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">Data Sharing Permissions</h1>
          <p className="text-[#6b7280] text-sm">Control what Carrier national sees from your territory. You're always in charge of your data.</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0066ff]/20 flex items-center justify-center text-[#0066ff] font-bold text-sm">MC</div>
          <div>
            <div className="text-white font-medium">{rep?.rep_name}</div>
            <div className="text-[#6b7280] text-sm">{rep?.region} · Carrier</div>
          </div>
          <div className="ml-auto text-[#6b7280] text-xs">
            Last updated: {perms?.updated_at?.split("T")[0] ?? "—"}
          </div>
        </div>
      </div>

      <PermissionsPanel repId={REP_ID} manufacturerId={CARRIER_ID} initialPerms={perms} />
    </div>
  );
}
