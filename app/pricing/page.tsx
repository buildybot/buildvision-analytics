import { db } from "@/db/client";
import { equipment_pricing, manufacturers, equipment_types } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionHeader } from "@/components/ui/section-header";
import { PricingCharts } from "@/components/charts/PricingCharts";
import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";

async function getPricingData(eqTypeId?: number, region?: string, year?: number) {
  const conditions = [];
  if (eqTypeId) conditions.push(eq(equipment_pricing.equipment_type_id, eqTypeId));
  if (region) conditions.push(eq(equipment_pricing.region, region));
  if (year) conditions.push(eq(equipment_pricing.year, year));

  const agg = await db.select({
    manufacturer_id: equipment_pricing.manufacturer_id,
    manufacturer_name: manufacturers.name,
    equipment_type_id: equipment_pricing.equipment_type_id,
    equipment_type_name: equipment_types.name,
    size_unit: equipment_pricing.size_unit,
    avg_price_per_unit: sql<number>`avg(price_usd / size_value)`,
    avg_total: sql<number>`avg(price_usd)`,
    count: sql<number>`count(*)`,
    region: equipment_pricing.region,
    year: equipment_pricing.year,
  }).from(equipment_pricing)
    .innerJoin(manufacturers, eq(equipment_pricing.manufacturer_id, manufacturers.id))
    .innerJoin(equipment_types, eq(equipment_pricing.equipment_type_id, equipment_types.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(
      equipment_pricing.manufacturer_id, manufacturers.name,
      equipment_pricing.equipment_type_id, equipment_types.name,
      equipment_pricing.size_unit, equipment_pricing.region, equipment_pricing.year
    )
    .orderBy(sql`avg(price_usd / size_value) asc`);

  return agg;
}

export default async function PricingPage() {
  const allData = await getPricingData(undefined, undefined, 2025);

  // Chillers comparison
  const chillerData = allData.filter(d => d.equipment_type_name === "Chiller");
  const ahuData = allData.filter(d => d.equipment_type_name === "Air Handler (AHU)");

  const carrierChiller = chillerData.filter(d => d.manufacturer_name === "Carrier");
  const carrierAvgTon = carrierChiller.length
    ? carrierChiller.reduce((s, d) => s + Number(d.avg_price_per_unit), 0) / carrierChiller.length
    : 0;

  // Competitive position: what % of categories Carrier is cheapest vs most expensive
  const eqTypeNames = [...new Set(allData.map(d => d.equipment_type_name))];
  let carrierCheapestCount = 0;
  for (const eqType of eqTypeNames) {
    const byMfg = allData.filter(d => d.equipment_type_name === eqType);
    const sorted = byMfg.sort((a, b) => Number(a.avg_price_per_unit) - Number(b.avg_price_per_unit));
    if (sorted[0]?.manufacturer_name === "Carrier") carrierCheapestCount++;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[#2A2A2F] text-2xl font-bold">Pricing Analysis</h1>
        <p className="text-[#6C6C71] text-sm mb-8">Carrier $/unit vs market — 2025 data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Carrier Avg $/Ton (Chillers)"
          value={`$${Math.round(carrierAvgTon)}`}
          sub="National average 2025"
          icon={DollarSign}
          color="blue"
        />
        <KpiCard
          label="Equipment Types Tracked"
          value={eqTypeNames.length}
          sub="With pricing benchmarks"
          icon={BarChart3}
          color="purple"
        />
        <KpiCard
          label="Pricing Records"
          value={allData.length}
          sub="Across all regions & years"
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          label="Price Competitive"
          value={`${carrierCheapestCount}/${eqTypeNames.length}`}
          sub="Categories where Carrier is best value"
          icon={Target}
          color="amber"
        />
      </div>

      <PricingCharts chillerData={chillerData} ahuData={ahuData} allData={allData} />

      {/* Detailed Table */}
      <div className="bg-[#F8F8F8] border border-[#C9CBCF] rounded-xl p-5">
        <SectionHeader title="Pricing Benchmarks — All Equipment Types (2025)" subtitle="Avg $/unit across all regions" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EDEDED] bg-[#F8F8F8]">
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Manufacturer</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Equipment</th>
                <th className="text-right text-[#6C6C71] font-medium px-5 py-3">Avg $/Unit</th>
                <th className="text-right text-[#6C6C71] font-medium px-5 py-3">Avg Total</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Unit</th>
                <th className="text-left text-[#6C6C71] font-medium px-5 py-3">Region</th>
              </tr>
            </thead>
            <tbody>
              {allData.slice(0, 60).map((row, i) => {
                const isCarrier = row.manufacturer_name === "Carrier";
                return (
                  <tr key={i} className={`border-b border-[#EDEDED] last:border-0 hover:bg-[#EDEDED]/50 transition-colors ${isCarrier ? "bg-[#4A3AFF]/5" : i % 2 === 1 ? "bg-[#F8F8F8]" : ""}`}>
                    <td className={`px-5 py-3.5 font-medium ${isCarrier ? "text-[#4A3AFF]" : "text-[#2A2A2F]"}`}>
                      {row.manufacturer_name}
                    </td>
                    <td className="px-5 py-3.5 text-[#6C6C71]">{row.equipment_type_name}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#2A2A2F]">
                      ${Math.round(Number(row.avg_price_per_unit)).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[#6C6C71]">
                      ${Math.round(Number(row.avg_total)).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-[#6C6C71]">/{row.size_unit}</td>
                    <td className="px-5 py-3.5 text-[#6C6C71]">{row.region}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
