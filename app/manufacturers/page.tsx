import { db } from "@/db/client";
import { manufacturers, spec_activity, basis_of_design, equipment_pricing } from "@/db/schema";
import { eq, sql, ne } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";

async function getMfgData() {
  const rows = await db.select({
    id: manufacturers.id,
    name: manufacturers.name,
    hq_city: manufacturers.hq_city,
    hq_state: manufacturers.hq_state,
    annual_revenue: manufacturers.annual_revenue,
    spec_count: sql<number>`(select count(*) from spec_activity where manufacturer_id = manufacturers.id)`,
    win_count: sql<number>`(select count(*) from spec_activity where manufacturer_id = manufacturers.id and status = 'won')`,
    loss_count: sql<number>`(select count(*) from spec_activity where manufacturer_id = manufacturers.id and status = 'lost')`,
    avg_bod: sql<number>`(select avg(bod_percentage) from basis_of_design where manufacturer_id = manufacturers.id and year = 2025)`,
    pricing_records: sql<number>`(select count(*) from equipment_pricing where manufacturer_id = manufacturers.id)`,
  }).from(manufacturers)
    .orderBy(sql`annual_revenue desc`);

  return rows;
}

const CARRIER_ID = 1;

export default async function ManufacturersPage() {
  const mfgs = await getMfgData();

  const totalAll = mfgs.reduce((s, m) => s + Number(m.spec_count), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#2A2A2F] text-2xl font-bold">Competitive Landscape</h1>
        <p className="text-[#6C6C71] text-sm mb-8">All 19 manufacturers tracked — revenue, spec share, BOD penetration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mfgs.map((mfg, i) => {
          const decided = Number(mfg.win_count) + Number(mfg.loss_count);
          const winRate = decided > 0 ? Math.round((Number(mfg.win_count) / decided) * 100) : 0;
          const shareOfSpecs = totalAll > 0 ? Math.round((Number(mfg.spec_count) / totalAll) * 100) : 0;
          const isCarrier = mfg.id === CARRIER_ID;

          return (
            <div key={i} className={`bg-[#F8F8F8] border rounded-xl p-5 ${isCarrier ? "border-[#4A3AFF]/40" : "border-[#C9CBCF]"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`font-semibold text-sm ${isCarrier ? "text-[#4A3AFF]" : "text-[#2A2A2F]"}`}>
                    {isCarrier && "● "}{mfg.name}
                  </div>
                  <div className="text-[#6C6C71] text-xs mt-0.5">{mfg.hq_city}, {mfg.hq_state}</div>
                </div>
                {mfg.annual_revenue && (
                  <div className="text-[#6C6C71] text-xs font-mono">${(mfg.annual_revenue / 1000).toFixed(1)}B</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[#2A2A2F] font-bold text-lg">{shareOfSpecs}%</div>
                  <div className="text-[#6C6C71] text-xs">Spec Share</div>
                </div>
                <div>
                  <div className={`font-bold text-lg ${winRate >= 50 ? "text-emerald-400" : winRate >= 35 ? "text-amber-400" : "text-red-400"}`}>{winRate}%</div>
                  <div className="text-[#6C6C71] text-xs">Win Rate</div>
                </div>
                <div>
                  <div className="text-[#2A2A2F] font-bold text-lg">{Math.round(Number(mfg.avg_bod ?? 0))}%</div>
                  <div className="text-[#6C6C71] text-xs">Avg BOD%</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#C9CBCF] flex justify-between text-xs text-[#6C6C71]">
                <span>{Number(mfg.spec_count)} specs</span>
                <span className="text-emerald-400">{Number(mfg.win_count)}W</span>
                <span className="text-red-400">{Number(mfg.loss_count)}L</span>
                <span>{Number(mfg.pricing_records)} price pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
