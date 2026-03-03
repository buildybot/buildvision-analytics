import { db } from "@/db/client";
import { spec_activity, engineering_firms, equipment_types, manufacturers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp, DollarSign, Trophy, Clock } from "lucide-react";

const CARRIER_ID = 1;
const REP_REGION = "Northeast";

async function getPipelineData() {
  const all = await db.select({
    id: spec_activity.id,
    project_name: spec_activity.project_name,
    status: spec_activity.status,
    city: spec_activity.city,
    state: spec_activity.state,
    value_usd: spec_activity.value_usd,
    date: spec_activity.date,
    firm_name: engineering_firms.name,
    eq_name: equipment_types.name,
  }).from(spec_activity)
    .innerJoin(engineering_firms, eq(spec_activity.engineering_firm_id, engineering_firms.id))
    .innerJoin(equipment_types, eq(spec_activity.equipment_type_id, equipment_types.id))
    .where(and(eq(spec_activity.region, REP_REGION), eq(spec_activity.manufacturer_id, CARRIER_ID)))
    .orderBy(sql`date desc`);

  return all;
}

export default async function RepPipelinePage() {
  const specs = await getPipelineData();

  const pending = specs.filter(s => s.status === "pending");
  const won = specs.filter(s => s.status === "won");
  const lost = specs.filter(s => s.status === "lost");
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? Math.round((won.length / decided) * 100) : 0;
  const pipelineValue = pending.reduce((s, p) => s + (p.value_usd ?? 0), 0);
  const wonValue = won.reduce((s, w) => s + (w.value_usd ?? 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-xl font-bold">My Pipeline</h1>
        <p className="text-[#6b7280] text-sm">Northeast spec activity — all statuses</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Pipeline Value" value={`$${(pipelineValue / 1e6).toFixed(1)}M`} sub={`${pending.length} pending`} icon={TrendingUp} color="amber" />
        <KpiCard label="Won Value" value={`$${(wonValue / 1e6).toFixed(1)}M`} sub={`${won.length} specs won`} icon={DollarSign} color="green" />
        <KpiCard label="Win Rate" value={`${winRate}%`} sub={`${won.length}W / ${lost.length}L`} icon={Trophy} color="blue" />
        <KpiCard label="Total Specs" value={specs.length} sub="All activity Northeast" icon={Clock} color="purple" />
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="bg-[#111827] border border-amber-400/20 rounded-xl p-5">
          <SectionHeader title="Active Pipeline" subtitle="Pending specs — not yet decided" />
          <div className="space-y-2">
            {pending.map(s => (
              <div key={s.id} className="flex items-start gap-3 py-2 border-b border-[#1f2937] last:border-0">
                <StatusBadge value="pending" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{s.project_name}</div>
                  <div className="text-[#6b7280] text-xs">{s.firm_name} · {s.city}, {s.state} · {s.eq_name?.replace("Chiller — ", "").replace("VRF / VRV System", "VRF")}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-amber-400 font-mono text-sm">${((s.value_usd ?? 0) / 1000).toFixed(0)}K</div>
                  <div className="text-[#4b5563] text-xs">{s.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decided */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <SectionHeader title="Decided Specs" subtitle="Won and lost — full history" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2937]">
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Status</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Project</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Firm</th>
                <th className="text-left text-[#6b7280] font-medium pb-3 pr-4">Equipment</th>
                <th className="text-right text-[#6b7280] font-medium pb-3 pr-4">Value</th>
                <th className="text-right text-[#6b7280] font-medium pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {[...won, ...lost].sort((a, b) => b.date.localeCompare(a.date)).map(s => (
                <tr key={s.id} className="border-b border-[#1f2937] last:border-0 hover:bg-[#1f2937]/50 transition-colors">
                  <td className="py-2.5 pr-4"><StatusBadge value={s.status} /></td>
                  <td className="py-2.5 pr-4 text-white font-medium">{s.project_name}</td>
                  <td className="py-2.5 pr-4 text-[#9ca3af]">{s.firm_name}</td>
                  <td className="py-2.5 pr-4 text-[#6b7280] text-xs">{s.eq_name?.replace("Chiller — ", "").replace("VRF / VRV System", "VRF")}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-white">${((s.value_usd ?? 0) / 1000).toFixed(0)}K</td>
                  <td className="py-2.5 text-right text-[#6b7280] font-mono text-xs">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
