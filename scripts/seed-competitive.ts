/**
 * Competitive expansion seed — adds new manufacturers, equipment types,
 * and 600+ additional pricing + BOD + spec records.
 * Run AFTER the base seed.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";
import { eq, sql, inArray } from "drizzle-orm";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client, { schema });

// ─── New Manufacturers ────────────────────────────────────────────────────────
const NEW_MANUFACTURERS = [
  { name: "Weil-McLain", hq_city: "Burr Ridge", hq_state: "IL", annual_revenue: 480 },
  { name: "Armstrong Fluid Technology", hq_city: "Toronto", hq_state: "ON", annual_revenue: 560 },
  { name: "Bell & Gossett (Xylem)", hq_city: "Morton Grove", hq_state: "IL", annual_revenue: 1400 },
  { name: "Baltimore Aircoil (BAC)", hq_city: "Jessup", hq_state: "MD", annual_revenue: 620 },
  { name: "Marley / SPX Cooling", hq_city: "Overland Park", hq_state: "KS", annual_revenue: 540 },
  { name: "Evapco", hq_city: "Taneytown", hq_state: "MD", annual_revenue: 390 },
  { name: "Daikin (VRF)", hq_city: "Osaka", hq_state: "JP", annual_revenue: 22000 },
];

// ─── New/Expanded Equipment Types ─────────────────────────────────────────────
const NEW_EQUIPMENT_TYPES = [
  { name: "Chiller — Air-Cooled", category: "Cooling", size_unit: "tons" },
  { name: "Chiller — Water-Cooled Centrifugal", category: "Cooling", size_unit: "tons" },
  { name: "Chiller — Water-Cooled Scroll", category: "Cooling", size_unit: "tons" },
  { name: "Chiller — Modular", category: "Cooling", size_unit: "tons" },
  { name: "Custom Air Handler", category: "Air", size_unit: "CFM" },
  { name: "Cooling Tower — Open Circuit", category: "Cooling", size_unit: "tons" },
  { name: "Cooling Tower — Closed Circuit", category: "Cooling", size_unit: "tons" },
  { name: "Boiler — Condensing", category: "Heating", size_unit: "MBH" },
  { name: "Boiler — Steam", category: "Heating", size_unit: "MBH" },
  { name: "Boiler — Hot Water", category: "Heating", size_unit: "MBH" },
  { name: "Heat Pump — Air Source", category: "Heating/Cooling", size_unit: "tons" },
  { name: "Heat Pump — Water Source", category: "Heating/Cooling", size_unit: "tons" },
  { name: "Heat Pump — Geothermal", category: "Heating/Cooling", size_unit: "tons" },
  { name: "Fan Coil Unit", category: "Terminal", size_unit: "CFM" },
  { name: "Terminal Unit (VAV)", category: "Terminal", size_unit: "CFM" },
  { name: "Split System — Commercial", category: "Packaged", size_unit: "tons" },
  { name: "Pump — Chilled Water", category: "Hydronic", size_unit: "GPM" },
  { name: "Pump — Condenser Water", category: "Hydronic", size_unit: "GPM" },
  { name: "VRF / VRV System", category: "Refrigerant", size_unit: "tons" },
];

// ─── Pricing Intelligence ─────────────────────────────────────────────────────
// Base $/unit by manufacturer × equipment type (market-accurate ranges)
type PricingSpec = { base: number; spread: number };
type PricingMatrix = { [mfgName: string]: PricingSpec };

const PRICING: { [eqType: string]: PricingMatrix } = {
  "Chiller — Air-Cooled": {
    "Carrier": { base: 520, spread: 80 },
    "Trane Technologies": { base: 540, spread: 90 },
    "York (JCI)": { base: 490, spread: 70 },
    "Johnson Controls": { base: 505, spread: 75 },
    "Daikin Applied": { base: 475, spread: 65 },
    "McQuay / Daikin": { base: 460, spread: 60 },
    "Lennox Commercial": { base: 445, spread: 55 },
  },
  "Chiller — Water-Cooled Centrifugal": {
    "Carrier": { base: 620, spread: 100 },
    "Trane Technologies": { base: 650, spread: 110 },
    "York (JCI)": { base: 580, spread: 90 },
    "Johnson Controls": { base: 595, spread: 85 },
    "Daikin Applied": { base: 560, spread: 80 },
    "McQuay / Daikin": { base: 540, spread: 75 },
    "Multistack": { base: 680, spread: 130 },
  },
  "Chiller — Water-Cooled Scroll": {
    "Carrier": { base: 480, spread: 70 },
    "Trane Technologies": { base: 495, spread: 75 },
    "York (JCI)": { base: 455, spread: 65 },
    "Johnson Controls": { base: 465, spread: 60 },
    "Daikin Applied": { base: 440, spread: 55 },
    "McQuay / Daikin": { base: 430, spread: 50 },
  },
  "Chiller — Modular": {
    "Multistack": { base: 640, spread: 120 },
    "Carrier": { base: 600, spread: 100 },
    "Trane Technologies": { base: 620, spread: 110 },
    "McQuay / Daikin": { base: 570, spread: 90 },
  },
  "Custom Air Handler": {
    "Carrier": { base: 5.2, spread: 1.8 },
    "Trane Technologies": { base: 5.5, spread: 2.0 },
    "Daikin Applied": { base: 4.9, spread: 1.6 },
    "Johnson Controls": { base: 5.0, spread: 1.7 },
    "Greenheck": { base: 4.2, spread: 1.4 },
    "Price Industries": { base: 3.8, spread: 1.2 },
  },
  "Cooling Tower — Open Circuit": {
    "Baltimore Aircoil (BAC)": { base: 85, spread: 25 },
    "Marley / SPX Cooling": { base: 78, spread: 22 },
    "Evapco": { base: 72, spread: 20 },
    "Carrier": { base: 92, spread: 28 },
    "Trane Technologies": { base: 88, spread: 26 },
  },
  "Cooling Tower — Closed Circuit": {
    "Baltimore Aircoil (BAC)": { base: 140, spread: 40 },
    "Marley / SPX Cooling": { base: 130, spread: 38 },
    "Evapco": { base: 125, spread: 35 },
    "Carrier": { base: 148, spread: 45 },
  },
  "Boiler — Condensing": {
    "Weil-McLain": { base: 28, spread: 8 },
    "Bosch HVAC": { base: 26, spread: 7 },
    "Carrier": { base: 32, spread: 9 },
    "Johnson Controls": { base: 30, spread: 8 },
    "Lennox Commercial": { base: 25, spread: 7 },
  },
  "Boiler — Steam": {
    "Weil-McLain": { base: 22, spread: 6 },
    "Bosch HVAC": { base: 20, spread: 5 },
    "Carrier": { base: 25, spread: 7 },
    "Johnson Controls": { base: 24, spread: 6 },
  },
  "Boiler — Hot Water": {
    "Weil-McLain": { base: 18, spread: 5 },
    "Bosch HVAC": { base: 17, spread: 4 },
    "Carrier": { base: 21, spread: 6 },
    "Johnson Controls": { base: 20, spread: 5 },
    "Lennox Commercial": { base: 16, spread: 4 },
  },
  "Heat Pump — Air Source": {
    "Carrier": { base: 320, spread: 60 },
    "Trane Technologies": { base: 340, spread: 65 },
    "Daikin Applied": { base: 300, spread: 55 },
    "Mitsubishi Electric": { base: 355, spread: 70 },
    "Bosch HVAC": { base: 285, spread: 50 },
    "Johnson Controls": { base: 310, spread: 58 },
  },
  "Heat Pump — Water Source": {
    "Carrier": { base: 380, spread: 70 },
    "Trane Technologies": { base: 400, spread: 75 },
    "Daikin Applied": { base: 360, spread: 65 },
    "Johnson Controls": { base: 370, spread: 68 },
    "York (JCI)": { base: 355, spread: 62 },
  },
  "Heat Pump — Geothermal": {
    "Carrier": { base: 450, spread: 90 },
    "Bosch HVAC": { base: 420, spread: 85 },
    "Trane Technologies": { base: 470, spread: 95 },
    "Johnson Controls": { base: 440, spread: 88 },
  },
  "Fan Coil Unit": {
    "Carrier": { base: 1.8, spread: 0.5 },
    "Trane Technologies": { base: 1.9, spread: 0.55 },
    "Johnson Controls": { base: 1.75, spread: 0.48 },
    "Price Industries": { base: 1.5, spread: 0.4 },
    "Daikin Applied": { base: 1.65, spread: 0.45 },
    "McQuay / Daikin": { base: 1.6, spread: 0.42 },
  },
  "Terminal Unit (VAV)": {
    "Price Industries": { base: 0.85, spread: 0.2 },
    "Carrier": { base: 0.92, spread: 0.22 },
    "Trane Technologies": { base: 0.95, spread: 0.24 },
    "Johnson Controls": { base: 0.88, spread: 0.21 },
    "Greenheck": { base: 0.78, spread: 0.18 },
  },
  "Split System — Commercial": {
    "Carrier": { base: 280, spread: 55 },
    "Trane Technologies": { base: 295, spread: 58 },
    "Lennox Commercial": { base: 255, spread: 48 },
    "York (JCI)": { base: 265, spread: 50 },
    "Mitsubishi Electric": { base: 310, spread: 65 },
    "Daikin (VRF)": { base: 270, spread: 52 },
  },
  "Pump — Chilled Water": {
    "Bell & Gossett (Xylem)": { base: 42, spread: 12 },
    "Armstrong Fluid Technology": { base: 45, spread: 14 },
    "Carrier": { base: 38, spread: 10 },
    "Trane Technologies": { base: 40, spread: 11 },
    "Johnson Controls": { base: 39, spread: 10 },
  },
  "Pump — Condenser Water": {
    "Bell & Gossett (Xylem)": { base: 38, spread: 10 },
    "Armstrong Fluid Technology": { base: 40, spread: 12 },
    "Carrier": { base: 35, spread: 9 },
    "Trane Technologies": { base: 36, spread: 9 },
  },
  "VRF / VRV System": {
    "Mitsubishi Electric": { base: 420, spread: 80 },
    "Daikin (VRF)": { base: 400, spread: 75 },
    "Carrier": { base: 385, spread: 70 },
    "Trane Technologies": { base: 395, spread: 72 },
    "Johnson Controls": { base: 375, spread: 68 },
    "Bosch HVAC": { base: 350, spread: 65 },
    "Lennox Commercial": { base: 345, spread: 60 },
  },
};

// ─── BOD specializations (which mfgs own which eq types) ─────────────────────
const BOD_DOMINANCE: { [eqType: string]: { [mfg: string]: number } } = {
  "Chiller — Air-Cooled": { "Carrier": 0.35, "Trane Technologies": 0.28, "York (JCI)": 0.18, "Daikin Applied": 0.12, "Lennox Commercial": 0.07 },
  "Chiller — Water-Cooled Centrifugal": { "Carrier": 0.38, "Trane Technologies": 0.30, "York (JCI)": 0.16, "Johnson Controls": 0.10, "Multistack": 0.06 },
  "Chiller — Modular": { "Multistack": 0.45, "Carrier": 0.22, "Trane Technologies": 0.20, "McQuay / Daikin": 0.13 },
  "Cooling Tower — Open Circuit": { "Baltimore Aircoil (BAC)": 0.38, "Marley / SPX Cooling": 0.32, "Evapco": 0.20, "Carrier": 0.10 },
  "Cooling Tower — Closed Circuit": { "Baltimore Aircoil (BAC)": 0.42, "Evapco": 0.30, "Marley / SPX Cooling": 0.20, "Carrier": 0.08 },
  "Boiler — Condensing": { "Weil-McLain": 0.42, "Bosch HVAC": 0.28, "Carrier": 0.15, "Johnson Controls": 0.10, "Lennox Commercial": 0.05 },
  "Boiler — Steam": { "Weil-McLain": 0.48, "Bosch HVAC": 0.30, "Carrier": 0.12, "Johnson Controls": 0.10 },
  "VRF / VRV System": { "Mitsubishi Electric": 0.38, "Daikin (VRF)": 0.32, "Carrier": 0.12, "Trane Technologies": 0.10, "Johnson Controls": 0.08 },
  "Fan Coil Unit": { "Price Industries": 0.30, "Carrier": 0.25, "Trane Technologies": 0.20, "Johnson Controls": 0.15, "Daikin Applied": 0.10 },
  "Pump — Chilled Water": { "Bell & Gossett (Xylem)": 0.45, "Armstrong Fluid Technology": 0.35, "Carrier": 0.12, "Trane Technologies": 0.08 },
  "Heat Pump — Air Source": { "Carrier": 0.28, "Trane Technologies": 0.26, "Mitsubishi Electric": 0.22, "Daikin Applied": 0.14, "Bosch HVAC": 0.10 },
};

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];
const REGION_MULT: { [r: string]: number } = {
  Northeast: 1.12, West: 1.08, Southeast: 0.98, Southwest: 0.96, Midwest: 1.0,
};

function rand(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedCompetitive() {
  console.log("⚡ Seeding competitive expansion data...\n");

  // ── Insert new manufacturers ───────────────────────────────────────────────
  const existingMfgs = await db.select({ name: schema.manufacturers.name }).from(schema.manufacturers);
  const existingNames = new Set(existingMfgs.map(m => m.name));
  const toInsert = NEW_MANUFACTURERS.filter(m => !existingNames.has(m.name));

  let newMfgRows: typeof schema.manufacturers.$inferSelect[] = [];
  if (toInsert.length) {
    newMfgRows = await db.insert(schema.manufacturers)
      .values(toInsert.map(m => ({ ...m, logo_url: null })))
      .returning();
    console.log(`  ✓ Added ${newMfgRows.length} new manufacturers`);
  }

  // Rebuild full mfg map
  const allMfgs = await db.select().from(schema.manufacturers);
  const mfgMap: { [name: string]: number } = {};
  allMfgs.forEach(m => { mfgMap[m.name] = m.id; });

  // ── Insert new equipment types ─────────────────────────────────────────────
  const existingEq = await db.select({ name: schema.equipment_types.name }).from(schema.equipment_types);
  const existingEqNames = new Set(existingEq.map(e => e.name));
  const eqToInsert = NEW_EQUIPMENT_TYPES.filter(e => !existingEqNames.has(e.name));

  let newEqRows: typeof schema.equipment_types.$inferSelect[] = [];
  if (eqToInsert.length) {
    newEqRows = await db.insert(schema.equipment_types).values(eqToInsert).returning();
    console.log(`  ✓ Added ${newEqRows.length} new equipment types`);
  }

  const allEq = await db.select().from(schema.equipment_types);
  const eqMap: { [name: string]: { id: number; size_unit: string } } = {};
  allEq.forEach(e => { eqMap[e.name] = { id: e.id, size_unit: e.size_unit }; });

  // ── Pricing records ────────────────────────────────────────────────────────
  console.log("  Generating pricing records...");
  const pricingRecords: (typeof schema.equipment_pricing.$inferInsert)[] = [];

  for (const [eqTypeName, mfgPricing] of Object.entries(PRICING)) {
    const eqInfo = eqMap[eqTypeName];
    if (!eqInfo) continue;

    for (const [mfgName, { base, spread }] of Object.entries(mfgPricing)) {
      const mfgId = mfgMap[mfgName];
      if (!mfgId) continue;

      for (const region of REGIONS) {
        const regionMult = REGION_MULT[region];
        for (const year of [2022, 2023, 2024, 2025]) {
          const yearMult = 1 + (year - 2022) * 0.042;
          // Generate 4-6 records per mfg/region/year/eqType
          const count = Math.floor(Math.random() * 3) + 4;
          for (let i = 0; i < count; i++) {
            let sizeVal: number;
            let modelSuffix: string;

            if (eqInfo.size_unit === "tons") {
              const sizes = eqTypeName.includes("Modular") ? [50, 100, 150, 200, 300] :
                eqTypeName.includes("Tower") ? [100, 200, 300, 500, 750, 1000] :
                eqTypeName.includes("Split") || eqTypeName.includes("Heat Pump") ? [2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30] :
                eqTypeName.includes("VRF") ? [2, 4, 6, 8, 10, 15, 20, 30, 40, 48] :
                [50, 100, 150, 200, 300, 400, 500];
              sizeVal = pick(sizes);
              modelSuffix = `${sizeVal}T`;
            } else if (eqInfo.size_unit === "CFM") {
              const sizes = eqTypeName.includes("Fan Coil") ? [200, 400, 600, 800, 1000, 1200] :
                eqTypeName.includes("VAV") ? [100, 200, 400, 600, 800, 1000, 1200, 1600] :
                [2000, 5000, 8000, 12000, 20000, 30000, 40000, 60000, 80000];
              sizeVal = pick(sizes);
              modelSuffix = `${Math.round(sizeVal / 100) * 100}`;
            } else if (eqInfo.size_unit === "MBH") {
              sizeVal = pick([500, 750, 1000, 1500, 2000, 3000, 4000, 6000]);
              modelSuffix = `${sizeVal}MBH`;
            } else { // GPM
              sizeVal = pick([50, 100, 200, 300, 500, 750, 1000, 1500]);
              modelSuffix = `${sizeVal}GPM`;
            }

            const pricePerUnit = (base + rand(-spread, spread)) * regionMult * yearMult;
            const totalPrice = pricePerUnit * sizeVal;
            const prefix = mfgName.split(" ")[0].substring(0, 6).toUpperCase();

            pricingRecords.push({
              manufacturer_id: mfgId,
              equipment_type_id: eqInfo.id,
              model_name: `${prefix}-${eqTypeName.split(" ")[0].toUpperCase().substring(0,3)}-${modelSuffix}`,
              size_value: sizeVal,
              size_unit: eqInfo.size_unit,
              price_usd: parseFloat(totalPrice.toFixed(0)),
              region,
              year,
            });
          }
        }
      }
    }
  }

  const BATCH = 50;
  for (let i = 0; i < pricingRecords.length; i += BATCH) {
    await db.insert(schema.equipment_pricing).values(pricingRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${pricingRecords.length} pricing records`);

  // ── BOD records for new eq types ───────────────────────────────────────────
  console.log("  Generating BOD records...");
  const firms = await db.select().from(schema.engineering_firms);
  const bodRecords: (typeof schema.basis_of_design.$inferInsert)[] = [];

  for (const [eqTypeName, dominance] of Object.entries(BOD_DOMINANCE)) {
    const eqInfo = eqMap[eqTypeName];
    if (!eqInfo) continue;

    for (const firm of firms) {
      for (const year of [2023, 2024, 2025]) {
        // Regional tilt: firms in their home region prefer home-grown brands
        const entries = Object.entries(dominance);
        let remaining = 100;
        for (let mi = 0; mi < entries.length; mi++) {
          const [mfgName, baseWeight] = entries[mi];
          const mfgId = mfgMap[mfgName];
          if (!mfgId) continue;
          const isLast = mi === entries.length - 1;
          const jitter = (Math.random() - 0.5) * 12;
          const bod_pct = isLast ? remaining : Math.min(remaining, Math.max(0, Math.round(baseWeight * 100 + jitter)));
          remaining -= bod_pct;
          if (bod_pct > 0) {
            bodRecords.push({
              engineering_firm_id: firm.id,
              manufacturer_id: mfgId,
              equipment_type_id: eqInfo.id,
              bod_percentage: bod_pct,
              project_count: Math.floor(Math.random() * 14) + 2,
              year,
              region: firm.region,
            });
          }
        }
      }
    }
  }

  for (let i = 0; i < bodRecords.length; i += BATCH) {
    await db.insert(schema.basis_of_design).values(bodRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${bodRecords.length} BOD records`);

  // ── Competitive spec activity (displacement events) ────────────────────────
  console.log("  Generating competitive displacement events...");

  const CARRIER_ID = mfgMap["Carrier"];
  const COMPETITORS = [
    "Trane Technologies", "York (JCI)", "Johnson Controls", "Daikin Applied",
    "Mitsubishi Electric", "Multistack", "Lennox Commercial"
  ];
  const allEqIds = allEq.map(e => e.id);

  const PROJECT_ADJECTIVES = ["Summit", "Metro", "Nexus", "Apex", "Harbor", "Meridian", "Gateway", "Legacy", "Pinnacle", "Horizon", "Central", "Civic", "Premier", "Heritage", "Landmark"];
  const PROJECT_TYPES = ["Tower", "Medical Center", "Data Center", "Campus", "Mixed-Use", "Hotel", "Corporate HQ", "Research Facility", "Government Center", "Innovation Park"];
  const CITY_MAP: { [r: string]: { city: string; state: string }[] } = {
    Northeast: [{ city: "New York", state: "NY" }, { city: "Boston", state: "MA" }, { city: "Philadelphia", state: "PA" }],
    Southeast: [{ city: "Atlanta", state: "GA" }, { city: "Charlotte", state: "NC" }, { city: "Miami", state: "FL" }],
    Midwest: [{ city: "Chicago", state: "IL" }, { city: "Detroit", state: "MI" }, { city: "Minneapolis", state: "MN" }],
    West: [{ city: "Los Angeles", state: "CA" }, { city: "Seattle", state: "WA" }, { city: "San Francisco", state: "CA" }],
    Southwest: [{ city: "Dallas", state: "TX" }, { city: "Houston", state: "TX" }, { city: "Phoenix", state: "AZ" }],
  };

  function randomDate(startYear: number, endYear: number): string {
    const start = new Date(startYear, 0, 1).getTime();
    const end = new Date(endYear, 11, 31).getTime();
    return new Date(start + Math.random() * (end - start)).toISOString().split("T")[0];
  }

  const specRecords: (typeof schema.spec_activity.$inferInsert)[] = [];
  const statuses = ["won", "won", "lost", "lost", "pending"] as const;

  // Generate competitive records for each major competitor
  for (const compName of COMPETITORS) {
    const compId = mfgMap[compName];
    if (!compId) continue;

    for (let i = 0; i < 35; i++) {
      const region = pick(REGIONS);
      const loc = pick(CITY_MAP[region]);
      const adj = pick(PROJECT_ADJECTIVES);
      const type = pick(PROJECT_TYPES);
      const firm = pick(firms.filter(f => f.region === region) ?? firms);
      const status = pick(statuses) as string;
      const eqTypeId = pick(allEqIds);

      specRecords.push({
        project_name: `${loc.city} ${adj} ${type}`,
        engineering_firm_id: firm.id,
        manufacturer_id: compId,
        equipment_type_id: eqTypeId,
        status,
        region,
        city: loc.city,
        state: loc.state,
        value_usd: Math.round(Math.random() * 4000000 + 100000),
        date: randomDate(2023, 2025),
      });
    }
  }

  // Extra Carrier records with richer variety
  for (let i = 0; i < 80; i++) {
    const region = pick(REGIONS);
    const loc = pick(CITY_MAP[region]);
    const firm = pick(firms.filter(f => f.region === region) ?? firms);
    const status = pick(["won", "won", "won", "lost", "lost", "pending"] as const) as string;
    const eqTypeId = pick(allEqIds);

    specRecords.push({
      project_name: `${loc.city} ${pick(PROJECT_ADJECTIVES)} ${pick(PROJECT_TYPES)}`,
      engineering_firm_id: firm.id,
      manufacturer_id: CARRIER_ID,
      equipment_type_id: eqTypeId,
      status,
      region,
      city: loc.city,
      state: loc.state,
      value_usd: Math.round(Math.random() * 5000000 + 150000),
      date: randomDate(2023, 2025),
    });
  }

  for (let i = 0; i < specRecords.length; i += BATCH) {
    await db.insert(schema.spec_activity).values(specRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${specRecords.length} spec activity records`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const [pCount] = await db.select({ c: sql<number>`count(*)` }).from(schema.equipment_pricing);
  const [bCount] = await db.select({ c: sql<number>`count(*)` }).from(schema.basis_of_design);
  const [sCount] = await db.select({ c: sql<number>`count(*)` }).from(schema.spec_activity);
  const [mCount] = await db.select({ c: sql<number>`count(*)` }).from(schema.manufacturers);
  const [eCount] = await db.select({ c: sql<number>`count(*)` }).from(schema.equipment_types);

  console.log(`\n✅ Competitive seed complete!`);
  console.log(`   Manufacturers: ${mCount.c} | Equipment types: ${eCount.c}`);
  console.log(`   Pricing: ${pCount.c} | BOD: ${bCount.c} | Specs: ${sCount.c}`);
  process.exit(0);
}

seedCompetitive().catch(e => { console.error(e); process.exit(1); });
