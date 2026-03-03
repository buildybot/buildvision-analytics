import { db } from "@/db/client";
import { equipment_pricing, manufacturers, equipment_types } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { SectionHeader } from "@/components/ui/section-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { DollarSign, TrendingUp } from "lucide-react";

const CARRIER_ID = 1;
const REP_REGION = "Northeast";

async function getLocalPricingData() {
  const rows = await db.select({
    mfg_name: manufacturers.name,
    eq_name: equipment_types.name,
    size_unit: equipment_pricing.size_unit,
    avg_ppu: sql<number>`avg(price_usd / size_value)`,
    count: sql<number>`count(*)`,
  }).from(equipment_pricing)
    .innerJoin(manufacturers, eq(equipment_pricing.manufacturer_id, manufacturers.id))
    .innerJoin(equipment_types, eq(equipment_pricing.equipment_type_id, equipment_types.id))
    .where(and(eq(equipment_pricing.region, REP_REGION), eq(equipment_pricing.year, 2025)))
    .groupBy(manufacturers.name, equipment_types.name, equipment_pricing.size_unit)
    .orderBy(sql`avg(price_usd / size_value) asc`);

  return rows;
}

export default async function RepPricingPage() {
  const rows = await getLocalPricingData();

  const carrierRows = rows.filter(r => r.mfg_name === "Carrier");
  const eqTypes = [...new Set(rows.map(r => r.eq_name))];

  const carrierAvg = carrierRows.length
    ? carrierRows.filter(r => r.size_unit === "tons").reduce((s, r) => s + Number(r.avg_ppu), 0) / (carrierRows.filter(r => r.size_unit === "tons").length || 1)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[#2A2A2F] text-xl font-bold">Local Pricing — Northeast</h1>
        <p className="text-[#6C6C71] text-sm">Carrier vs competitors · 2025 · your region</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Carrier Avg $/Ton (Northeast)" value={`$${Math.round(carrierAvg)}`} sub="All tonnage equipment 2025" icon={DollarSign} color="blue" />
        <KpiCard label="Equipment Types" value={eqTypes.length} sub="With Northeast pricing data" icon={TrendingUp} color="green" />
      </div>

      {eqTypes.slice(0, 8).map(eqType => {
        const eqRows = rows.filter(r => r.eq_name === eqType).sort((a, b) => Number(a.avg_ppu) - Number(b.avg_ppu));
        const carrierRow = eqRows.find(r => r.mfg_name === "Carrier");
        const lowest = eqRows[0];
        const unit = eqRows[0]?.size_unit ?? "";

        return (
          <div key={eqType} className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#2A2A2F] font-semibold">{eqType}</div>
                <div className="text-[#6C6C71] text-xs">Northeast 2025 — avg $/{unit}</div>
              </div>
              {carrierRow && lowest && (
                <div className={`text-xs font-medium px-2 py-1 rounded ${carrierRow.mfg_name === lowest.mfg_name ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                  {carrierRow.mfg_name === lowest.mfg_name ? "✓ Best Value" : `+${Math.round(((Number(carrierRow.avg_ppu) - Number(lowest.avg_ppu)) / Number(lowest.avg_ppu)) * 100)}% vs low`}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {eqRows.slice(0, 6).map((row, i) => {
                const isCarrier = row.mfg_name === "Carrier";
                const maxPPU = Math.max(...eqRows.map(r => Number(r.avg_ppu)));
                const pct = maxPPU > 0 ? (Number(row.avg_ppu) / maxPPU) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`text-xs w-32 truncate flex-shrink-0 ${isCarrier ? "text-[#4A3AFF] font-semibold" : "text-[#6C6C71]"}`}>
                      {row.mfg_name.replace(" Technologies", "").replace(" Applied", "").replace(" Commercial", "")}
                    </div>
                    <div className="flex-1 h-2 bg-[#EDEDED] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isCarrier ? "#4A3AFF" : i === 0 ? "#16DA7C" : "#C9CBCF" }} />
                    </div>
                    <span className={`text-xs font-mono w-16 text-right font-semibold ${isCarrier ? "text-[#4A3AFF]" : i === 0 ? "text-emerald-400" : "text-[#6C6C71]"}`}>
                      ${Math.round(Number(row.avg_ppu)).toLocaleString()}/{unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
