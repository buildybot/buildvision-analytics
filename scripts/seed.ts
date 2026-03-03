import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
const db = drizzle(client, { schema });

// ─── Reference Data ───────────────────────────────────────────────────────────

const MANUFACTURERS = [
  { name: "Carrier", hq_city: "Palm Beach Gardens", hq_state: "FL", annual_revenue: 19600 },
  { name: "Trane Technologies", hq_city: "Davidson", hq_state: "NC", annual_revenue: 16000 },
  { name: "Daikin Applied", hq_city: "Plymouth", hq_state: "MN", annual_revenue: 7200 },
  { name: "Johnson Controls", hq_city: "Milwaukee", hq_state: "WI", annual_revenue: 25400 },
  { name: "Lennox Commercial", hq_city: "Richardson", hq_state: "TX", annual_revenue: 4600 },
  { name: "York (JCI)", hq_city: "York", hq_state: "PA", annual_revenue: 3800 },
  { name: "Mitsubishi Electric", hq_city: "Suwanee", hq_state: "GA", annual_revenue: 6100 },
  { name: "Bosch HVAC", hq_city: "Farmington Hills", hq_state: "MI", annual_revenue: 2200 },
  { name: "McQuay / Daikin", hq_city: "Plymouth", hq_state: "MN", annual_revenue: 1800 },
  { name: "Multistack", hq_city: "La Crosse", hq_state: "WI", annual_revenue: 320 },
  { name: "Greenheck", hq_city: "Schofield", hq_state: "WI", annual_revenue: 1100 },
  { name: "Price Industries", hq_city: "Winnipeg", hq_state: "MB", annual_revenue: 980 },
];

const EQUIPMENT_TYPES = [
  { name: "Chiller", category: "Cooling", size_unit: "tons" },
  { name: "Air Handler (AHU)", category: "Air", size_unit: "CFM" },
  { name: "Rooftop Unit (RTU)", category: "Packaged", size_unit: "tons" },
  { name: "VRF System", category: "Refrigerant", size_unit: "tons" },
  { name: "Cooling Tower", category: "Cooling", size_unit: "tons" },
  { name: "Heat Pump", category: "Heating/Cooling", size_unit: "tons" },
  { name: "Fan Coil Unit", category: "Terminal", size_unit: "CFM" },
  { name: "Boiler", category: "Heating", size_unit: "MBH" },
  { name: "Pump", category: "Hydronic", size_unit: "GPM" },
  { name: "DOAS Unit", category: "Air", size_unit: "CFM" },
];

const ENGINEERING_FIRMS = [
  { name: "AKF Group", city: "New York", state: "NY", region: "Northeast", size_tier: "large" },
  { name: "WSP USA", city: "New York", state: "NY", region: "Northeast", size_tier: "large" },
  { name: "Jaros Baum & Bolles", city: "New York", state: "NY", region: "Northeast", size_tier: "large" },
  { name: "Cosentini Associates", city: "New York", state: "NY", region: "Northeast", size_tier: "large" },
  { name: "Arup", city: "New York", state: "NY", region: "Northeast", size_tier: "large" },
  { name: "BR+A Consulting Engineers", city: "Boston", state: "MA", region: "Northeast", size_tier: "large" },
  { name: "AEI Affiliated Engineers", city: "Madison", state: "WI", region: "Midwest", size_tier: "mid" },
  { name: "Henderson Engineers", city: "Lenexa", state: "KS", region: "Midwest", size_tier: "mid" },
  { name: "Smith Group", city: "Detroit", state: "MI", region: "Midwest", size_tier: "large" },
  { name: "Hanson Professional Services", city: "Springfield", state: "IL", region: "Midwest", size_tier: "mid" },
  { name: "Interface Engineering", city: "Portland", state: "OR", region: "West", size_tier: "mid" },
  { name: "Glumac", city: "Portland", state: "OR", region: "West", size_tier: "mid" },
  { name: "Syska Hennessy Group", city: "Los Angeles", state: "CA", region: "West", size_tier: "large" },
  { name: "PAE Consulting Engineers", city: "Portland", state: "OR", region: "West", size_tier: "mid" },
  { name: "Newcomb & Boyd", city: "Atlanta", state: "GA", region: "Southeast", size_tier: "mid" },
  { name: "AHA Consulting Engineers", city: "Atlanta", state: "GA", region: "Southeast", size_tier: "mid" },
  { name: "RMF Engineering", city: "Charleston", state: "SC", region: "Southeast", size_tier: "mid" },
  { name: "Barge Design Solutions", city: "Nashville", state: "TN", region: "Southeast", size_tier: "mid" },
  { name: "KFI Engineers", city: "Dallas", state: "TX", region: "Southwest", size_tier: "mid" },
  { name: "TLC Engineering Solutions", city: "Dallas", state: "TX", region: "Southwest", size_tier: "large" },
];

const SUBCONTRACTORS = [
  { name: "ACS Mechanical", city: "New York", state: "NY", region: "Northeast", specialty: "mechanical", size_tier: "large" },
  { name: "Forest Electric", city: "New York", state: "NY", region: "Northeast", specialty: "controls", size_tier: "large" },
  { name: "University Mechanical Contractors", city: "Hackensack", state: "NJ", region: "Northeast", specialty: "mechanical", size_tier: "large" },
  { name: "Paramount Mechanical", city: "Boston", state: "MA", region: "Northeast", specialty: "mechanical", size_tier: "mid" },
  { name: "National Plumbing & Heating", city: "Philadelphia", state: "PA", region: "Northeast", specialty: "plumbing", size_tier: "mid" },
  { name: "Limbach Company", city: "Pittsburgh", state: "PA", region: "Northeast", specialty: "mechanical", size_tier: "large" },
  { name: "Murphy Company", city: "St. Louis", state: "MO", region: "Midwest", specialty: "mechanical", size_tier: "large" },
  { name: "Mechanical Inc", city: "Minneapolis", state: "MN", region: "Midwest", specialty: "mechanical", size_tier: "mid" },
  { name: "W.E. Bowers", city: "Columbus", state: "OH", region: "Midwest", specialty: "sheet_metal", size_tier: "mid" },
  { name: "J&R Mechanical", city: "Chicago", state: "IL", region: "Midwest", specialty: "mechanical", size_tier: "large" },
  { name: "Harrington Industrial Plastics", city: "Chicago", state: "IL", region: "Midwest", specialty: "controls", size_tier: "mid" },
  { name: "McKinstry", city: "Seattle", state: "WA", region: "West", specialty: "mechanical", size_tier: "large" },
  { name: "Southland Industries", city: "Los Angeles", state: "CA", region: "West", specialty: "mechanical", size_tier: "large" },
  { name: "Critchfield Mechanical", city: "San Jose", state: "CA", region: "West", specialty: "mechanical", size_tier: "mid" },
  { name: "AMS Mechanical Systems", city: "San Francisco", state: "CA", region: "West", specialty: "mechanical", size_tier: "mid" },
  { name: "Western Pacific Mechanical", city: "Portland", state: "OR", region: "West", specialty: "plumbing", size_tier: "mid" },
  { name: "Branch & Associates", city: "Atlanta", state: "GA", region: "Southeast", specialty: "mechanical", size_tier: "large" },
  { name: "Consolidated Mechanical", city: "Charlotte", state: "NC", region: "Southeast", specialty: "mechanical", size_tier: "mid" },
  { name: "Southeast Mechanical Contractors", city: "Tampa", state: "FL", region: "Southeast", specialty: "sheet_metal", size_tier: "mid" },
  { name: "Gulf Coast Mechanical", city: "Orlando", state: "FL", region: "Southeast", specialty: "mechanical", size_tier: "mid" },
  { name: "Alpha Mechanical Services", city: "Nashville", state: "TN", region: "Southeast", specialty: "controls", size_tier: "small" },
  { name: "Tolin Mechanical Systems", city: "Dallas", state: "TX", region: "Southwest", specialty: "mechanical", size_tier: "large" },
  { name: "Satterfield & Pontikes", city: "Houston", state: "TX", region: "Southwest", specialty: "mechanical", size_tier: "large" },
  { name: "Baker Mechanical", city: "Phoenix", state: "AZ", region: "Southwest", specialty: "mechanical", size_tier: "mid" },
  { name: "Sun Valley Mechanical", city: "Las Vegas", state: "NV", region: "Southwest", specialty: "sheet_metal", size_tier: "mid" },
  { name: "Control Southern", city: "Atlanta", state: "GA", region: "Southeast", specialty: "controls", size_tier: "mid" },
  { name: "Dynalectric", city: "San Diego", state: "CA", region: "West", specialty: "controls", size_tier: "mid" },
  { name: "TDIndustries", city: "Dallas", state: "TX", region: "Southwest", specialty: "mechanical", size_tier: "large" },
];

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];

const REP_DATA = [
  { rep_name: "Marcus Chen", region: "Northeast", city: "New York", state: "NY" },
  { rep_name: "Sarah Kovacs", region: "Northeast", city: "Boston", state: "MA" },
  { rep_name: "David Okafor", region: "Midwest", city: "Chicago", state: "IL" },
  { rep_name: "Jennifer Walsh", region: "Midwest", city: "Detroit", state: "MI" },
  { rep_name: "Robert Nguyen", region: "West", city: "Los Angeles", state: "CA" },
  { rep_name: "Amanda Torres", region: "West", city: "Seattle", state: "WA" },
  { rep_name: "Kevin Patel", region: "Southeast", city: "Atlanta", state: "GA" },
  { rep_name: "Lisa Drummond", region: "Southeast", city: "Charlotte", state: "NC" },
  { rep_name: "James Whitfield", region: "Southwest", city: "Dallas", state: "TX" },
  { rep_name: "Rachel Goldstein", region: "Southwest", city: "Phoenix", state: "AZ" },
];

const PROJECT_ADJECTIVES = ["Premier", "Gateway", "Harbor", "Summit", "Meridian", "Pinnacle", "Apex", "Horizon", "Legacy", "Nexus", "Landmark", "Central", "Metro", "Civic", "Heritage"];
const PROJECT_TYPES = ["Tower", "Office Complex", "Medical Center", "Research Campus", "Data Center", "Hotel & Conference", "Mixed-Use Development", "Government Center", "University Facility", "Logistics Hub", "Innovation Park", "Corporate HQ"];
const CITIES: { [region: string]: { city: string; state: string }[] } = {
  Northeast: [
    { city: "New York", state: "NY" }, { city: "Boston", state: "MA" },
    { city: "Philadelphia", state: "PA" }, { city: "Newark", state: "NJ" },
    { city: "Hartford", state: "CT" },
  ],
  Southeast: [
    { city: "Atlanta", state: "GA" }, { city: "Charlotte", state: "NC" },
    { city: "Miami", state: "FL" }, { city: "Nashville", state: "TN" },
    { city: "Raleigh", state: "NC" },
  ],
  Midwest: [
    { city: "Chicago", state: "IL" }, { city: "Detroit", state: "MI" },
    { city: "Minneapolis", state: "MN" }, { city: "Columbus", state: "OH" },
    { city: "St. Louis", state: "MO" },
  ],
  West: [
    { city: "Los Angeles", state: "CA" }, { city: "Seattle", state: "WA" },
    { city: "San Francisco", state: "CA" }, { city: "Portland", state: "OR" },
    { city: "Denver", state: "CO" },
  ],
  Southwest: [
    { city: "Dallas", state: "TX" }, { city: "Houston", state: "TX" },
    { city: "Phoenix", state: "AZ" }, { city: "Las Vegas", state: "NV" },
    { city: "Austin", state: "TX" },
  ],
};

function rand(min: number, max: number, decimals = 0): number {
  const v = Math.random() * (max - min) + min;
  return decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v);
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().split("T")[0];
}

async function seed() {
  console.log("🌱 Seeding BuildVision Analytics database...\n");

  // ── Manufacturers ──────────────────────────────────────────────────────────
  console.log("  Inserting manufacturers...");
  const mfgRows = await db.insert(schema.manufacturers).values(
    MANUFACTURERS.map(m => ({ ...m, logo_url: null }))
  ).returning();
  const mfgMap: { [name: string]: number } = {};
  mfgRows.forEach(m => { mfgMap[m.name] = m.id; });
  const carrierId = mfgMap["Carrier"];
  console.log(`  ✓ ${mfgRows.length} manufacturers`);

  // ── Equipment Types ────────────────────────────────────────────────────────
  console.log("  Inserting equipment types...");
  const eqRows = await db.insert(schema.equipment_types).values(EQUIPMENT_TYPES).returning();
  const eqMap: { [name: string]: number } = {};
  eqRows.forEach(e => { eqMap[e.name] = e.id; });
  console.log(`  ✓ ${eqRows.length} equipment types`);

  // ── Engineering Firms ──────────────────────────────────────────────────────
  console.log("  Inserting engineering firms...");
  const firmRows = await db.insert(schema.engineering_firms).values(ENGINEERING_FIRMS).returning();
  const firmIds = firmRows.map(f => f.id);
  console.log(`  ✓ ${firmRows.length} engineering firms`);

  // ── Subcontractors ─────────────────────────────────────────────────────────
  console.log("  Inserting subcontractors...");
  const subRows = await db.insert(schema.subcontractors).values(SUBCONTRACTORS).returning();
  const subIds = subRows.map(s => s.id);
  console.log(`  ✓ ${subRows.length} subcontractors`);

  // ── Rep Territories ────────────────────────────────────────────────────────
  console.log("  Inserting rep territories...");
  const repRows = await db.insert(schema.rep_territories).values(
    REP_DATA.map(r => ({ ...r, manufacturer_id: carrierId }))
  ).returning();
  const repIds = repRows.map(r => r.id);
  console.log(`  ✓ ${repRows.length} reps`);

  // ── Rep Permissions ────────────────────────────────────────────────────────
  console.log("  Inserting rep permissions...");
  // Varied permission states: some open, some locked down, some mixed
  const permConfigs = [
    // Marcus Chen - shares everything (power user)
    { share_pricing: true, share_projects: true, share_competitive: true, share_engineering: true, share_pipeline: true, share_subcontractors: true },
    // Sarah Kovacs - shares most, not pipeline
    { share_pricing: true, share_projects: true, share_competitive: true, share_engineering: true, share_pipeline: false, share_subcontractors: true },
    // David Okafor - shares pricing & engineering only
    { share_pricing: true, share_projects: false, share_competitive: false, share_engineering: true, share_pipeline: false, share_subcontractors: false },
    // Jennifer Walsh - locked down
    { share_pricing: false, share_projects: false, share_competitive: false, share_engineering: false, share_pipeline: false, share_subcontractors: false },
    // Robert Nguyen - shares all except pipeline
    { share_pricing: true, share_projects: true, share_competitive: true, share_engineering: true, share_pipeline: false, share_subcontractors: true },
    // Amanda Torres - shares pricing and subs
    { share_pricing: true, share_projects: false, share_competitive: false, share_engineering: false, share_pipeline: false, share_subcontractors: true },
    // Kevin Patel - fully open
    { share_pricing: true, share_projects: true, share_competitive: true, share_engineering: true, share_pipeline: true, share_subcontractors: true },
    // Lisa Drummond - shares most except competitive
    { share_pricing: true, share_projects: true, share_competitive: false, share_engineering: true, share_pipeline: false, share_subcontractors: true },
    // James Whitfield - minimal sharing
    { share_pricing: false, share_projects: false, share_competitive: false, share_engineering: true, share_pipeline: false, share_subcontractors: false },
    // Rachel Goldstein - shares everything
    { share_pricing: true, share_projects: true, share_competitive: true, share_engineering: true, share_pipeline: true, share_subcontractors: true },
  ];
  await db.insert(schema.rep_permissions).values(
    repIds.map((repId, i) => ({
      rep_id: repId,
      manufacturer_id: carrierId,
      ...permConfigs[i],
    }))
  );
  console.log(`  ✓ ${repIds.length} permission records`);

  // ── Equipment Pricing ──────────────────────────────────────────────────────
  console.log("  Inserting pricing records...");
  // $/ton ranges by manufacturer for chillers (realistic market data)
  const chiller_pricing: { [mfg: string]: { base: number; spread: number } } = {
    "Carrier": { base: 550, spread: 120 },
    "Trane Technologies": { base: 570, spread: 130 },
    "Daikin Applied": { base: 510, spread: 110 },
    "Johnson Controls": { base: 530, spread: 100 },
    "Lennox Commercial": { base: 490, spread: 90 },
    "York (JCI)": { base: 505, spread: 95 },
    "Multistack": { base: 620, spread: 150 },
    "McQuay / Daikin": { base: 490, spread: 105 },
    "Mitsubishi Electric": { base: 575, spread: 125 },
    "Bosch HVAC": { base: 460, spread: 85 },
    "Greenheck": { base: 440, spread: 80 },
    "Price Industries": { base: 420, spread: 75 },
  };
  // $/CFM for AHUs
  const ahu_pricing: { [mfg: string]: { base: number; spread: number } } = {
    "Carrier": { base: 3.8, spread: 1.2 },
    "Trane Technologies": { base: 4.0, spread: 1.3 },
    "Daikin Applied": { base: 3.6, spread: 1.1 },
    "Johnson Controls": { base: 3.7, spread: 1.0 },
    "Lennox Commercial": { base: 3.2, spread: 0.9 },
    "York (JCI)": { base: 3.4, spread: 1.0 },
    "Greenheck": { base: 3.0, spread: 0.8 },
    "Price Industries": { base: 2.9, spread: 0.7 },
    "Mitsubishi Electric": { base: 4.2, spread: 1.4 },
    "Bosch HVAC": { base: 3.1, spread: 0.9 },
    "Multistack": { base: 4.5, spread: 1.6 },
    "McQuay / Daikin": { base: 3.5, spread: 1.0 },
  };

  const pricingRecords = [];
  const chillerId = eqMap["Chiller"];
  const ahuId = eqMap["Air Handler (AHU)"];
  const rtuId = eqMap["Rooftop Unit (RTU)"];
  const vrfId = eqMap["VRF System"];

  for (const mfg of mfgRows) {
    const cpBase = chiller_pricing[mfg.name]?.base ?? 500;
    const cpSpread = chiller_pricing[mfg.name]?.spread ?? 100;
    const apBase = ahu_pricing[mfg.name]?.base ?? 3.5;
    const apSpread = ahu_pricing[mfg.name]?.spread ?? 1.0;

    for (const region of REGIONS) {
      const regionMult = region === "Northeast" ? 1.12 : region === "West" ? 1.08 : region === "Southwest" ? 0.96 : region === "Southeast" ? 0.98 : 1.0;
      for (let year = 2022; year <= 2025; year++) {
        const yearMult = 1 + (year - 2022) * 0.04; // ~4% inflation per year
        // Chillers: 50–1500 tons, 12 records per mfg/region/year
        for (let i = 0; i < 5; i++) {
          const sizeVal = pick([50, 100, 150, 200, 300, 400, 500, 600, 750, 1000, 1200, 1500]);
          const price_per_unit = (cpBase + rand(-cpSpread, cpSpread)) * regionMult * yearMult;
          pricingRecords.push({ manufacturer_id: mfg.id, equipment_type_id: chillerId, model_name: `${mfg.name.split(" ")[0]}-CH-${sizeVal}`, size_value: sizeVal, size_unit: "tons", price_usd: parseFloat((price_per_unit * sizeVal).toFixed(0)), region, year });
        }
        // AHUs: 2000–50000 CFM
        for (let i = 0; i < 5; i++) {
          const sizeVal = pick([2000, 5000, 8000, 12000, 20000, 30000, 40000, 50000]);
          const price_per_cfm = (apBase + rand(-apSpread * 10, apSpread * 10) / 10) * regionMult * yearMult;
          pricingRecords.push({ manufacturer_id: mfg.id, equipment_type_id: ahuId, model_name: `${mfg.name.split(" ")[0]}-AHU-${Math.round(sizeVal / 1000)}K`, size_value: sizeVal, size_unit: "CFM", price_usd: parseFloat((price_per_cfm * sizeVal).toFixed(0)), region, year });
        }
        // RTUs: 3–50 tons
        if (["Carrier", "Trane Technologies", "Lennox Commercial", "York (JCI)", "Johnson Controls"].includes(mfg.name)) {
          for (let i = 0; i < 3; i++) {
            const sizeVal = pick([3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50]);
            const price_per_unit = rand(220, 420) * regionMult * yearMult;
            pricingRecords.push({ manufacturer_id: mfg.id, equipment_type_id: rtuId, model_name: `${mfg.name.split(" ")[0]}-RTU-${sizeVal}T`, size_value: sizeVal, size_unit: "tons", price_usd: parseFloat((price_per_unit * sizeVal).toFixed(0)), region, year });
          }
        }
        // VRF: 2–50 tons
        if (["Mitsubishi Electric", "Daikin Applied", "Carrier", "Johnson Controls", "Bosch HVAC"].includes(mfg.name)) {
          for (let i = 0; i < 3; i++) {
            const sizeVal = pick([2, 4, 6, 8, 10, 15, 20, 30, 40, 50]);
            const price_per_unit = rand(400, 750) * regionMult * yearMult;
            pricingRecords.push({ manufacturer_id: mfg.id, equipment_type_id: vrfId, model_name: `${mfg.name.split(" ")[0]}-VRF-${sizeVal}T`, size_value: sizeVal, size_unit: "tons", price_usd: parseFloat((price_per_unit * sizeVal).toFixed(0)), region, year });
          }
        }
      }
    }
  }

  // Batch insert
  const BATCH = 50;
  for (let i = 0; i < pricingRecords.length; i += BATCH) {
    await db.insert(schema.equipment_pricing).values(pricingRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${pricingRecords.length} pricing records`);

  // ── Basis of Design ────────────────────────────────────────────────────────
  console.log("  Inserting BOD records...");
  // Carrier-specific BOD strengths: good in Northeast/Southeast for chillers
  // Trane strong in Midwest, Daikin strong in West, etc.
  const bodRecords = [];
  const bodEqTypes = [chillerId, ahuId, rtuId, vrfId];

  // BOD allocation weights per firm for key manufacturers (Carrier POV)
  const bodWeights: { [firmCity: string]: { [mfgName: string]: number } } = {
    "New York": { "Carrier": 0.38, "Trane Technologies": 0.28, "Daikin Applied": 0.15, "Johnson Controls": 0.10, "York (JCI)": 0.09 },
    "Boston": { "Carrier": 0.32, "Trane Technologies": 0.31, "Daikin Applied": 0.18, "Johnson Controls": 0.12, "Lennox Commercial": 0.07 },
    "Chicago": { "Carrier": 0.22, "Trane Technologies": 0.35, "Johnson Controls": 0.25, "Daikin Applied": 0.10, "York (JCI)": 0.08 },
    "Detroit": { "Carrier": 0.25, "Johnson Controls": 0.32, "Trane Technologies": 0.24, "Daikin Applied": 0.12, "Bosch HVAC": 0.07 },
    "Los Angeles": { "Carrier": 0.20, "Daikin Applied": 0.32, "Mitsubishi Electric": 0.22, "Trane Technologies": 0.16, "McQuay / Daikin": 0.10 },
    "Seattle": { "Carrier": 0.18, "Daikin Applied": 0.30, "Mitsubishi Electric": 0.28, "Trane Technologies": 0.14, "Bosch HVAC": 0.10 },
    "Atlanta": { "Carrier": 0.42, "Trane Technologies": 0.25, "Daikin Applied": 0.15, "Lennox Commercial": 0.10, "Johnson Controls": 0.08 },
    "Charlotte": { "Carrier": 0.40, "Trane Technologies": 0.27, "Johnson Controls": 0.15, "Daikin Applied": 0.12, "Lennox Commercial": 0.06 },
    "Dallas": { "Carrier": 0.28, "Trane Technologies": 0.30, "Lennox Commercial": 0.20, "Johnson Controls": 0.12, "York (JCI)": 0.10 },
    "Portland": { "Carrier": 0.15, "Daikin Applied": 0.35, "Mitsubishi Electric": 0.28, "Trane Technologies": 0.12, "McQuay / Daikin": 0.10 },
    "Madison": { "Carrier": 0.20, "Multistack": 0.35, "Trane Technologies": 0.25, "Johnson Controls": 0.12, "McQuay / Daikin": 0.08 },
    "Nashville": { "Carrier": 0.35, "Trane Technologies": 0.28, "Lennox Commercial": 0.18, "Johnson Controls": 0.12, "York (JCI)": 0.07 },
    // defaults
  };

  for (const firm of firmRows) {
    const weights = bodWeights[firm.city ?? ""] ?? { "Carrier": 0.28, "Trane Technologies": 0.28, "Daikin Applied": 0.18, "Johnson Controls": 0.14, "Lennox Commercial": 0.12 };
    for (const eqTypeId of bodEqTypes) {
      for (const year of [2023, 2024, 2025]) {
        let remaining = 100;
        const mfgEntries = Object.entries(weights);
        for (let mi = 0; mi < mfgEntries.length; mi++) {
          const [mfgName, baseWeight] = mfgEntries[mi];
          if (!mfgMap[mfgName]) continue;
          const isLast = mi === mfgEntries.length - 1;
          const jitter = rand(-5, 5);
          const bod_pct = isLast ? remaining : Math.min(remaining, Math.max(0, Math.round(baseWeight * 100 + jitter)));
          remaining -= bod_pct;
          if (bod_pct > 0) {
            bodRecords.push({
              engineering_firm_id: firm.id,
              manufacturer_id: mfgMap[mfgName],
              equipment_type_id: eqTypeId,
              bod_percentage: bod_pct,
              project_count: rand(2, 18),
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

  // ── Spec Activity ──────────────────────────────────────────────────────────
  console.log("  Inserting spec activity...");
  const specRecords = [];
  const statuses = ["won", "won", "won", "lost", "lost", "pending", "pending"] as const; // Carrier win rate ~43%
  const allEqTypes = eqRows.map(e => e.id);

  for (let i = 0; i < 400; i++) {
    const region = pick(REGIONS);
    const locationPool = CITIES[region];
    const loc = pick(locationPool);
    const firm = pick(firmRows.filter(f => f.region === region) ?? firmRows);
    const adj = pick(PROJECT_ADJECTIVES);
    const type = pick(PROJECT_TYPES);
    const project_name = `${loc.city} ${adj} ${type}`;
    const eqTypeId = pick(allEqTypes);
    const isCarrier = Math.random() < 0.28; // Carrier gets ~28% of specs
    const mfg = isCarrier ? { id: carrierId } : pick(mfgRows.filter(m => m.id !== carrierId));
    const status = pick(statuses);
    const value = rand(85000, 4200000);

    specRecords.push({
      project_name,
      engineering_firm_id: firm.id,
      manufacturer_id: mfg.id,
      equipment_type_id: eqTypeId,
      status: status as string,
      region,
      city: loc.city,
      state: loc.state,
      value_usd: value,
      date: randomDate(2023, 2025),
    });
  }

  for (let i = 0; i < specRecords.length; i += BATCH) {
    await db.insert(schema.spec_activity).values(specRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${specRecords.length} spec activity records`);

  // ── Rep-Subcontractor Relationships ────────────────────────────────────────
  console.log("  Inserting rep-subcontractor relationships...");
  const relRecords = [];
  const relStrengths = ["primary", "secondary", "occasional"] as const;
  const repPermMap: { [repId: number]: typeof permConfigs[0] } = {};
  repIds.forEach((id, i) => { repPermMap[id] = permConfigs[i]; });

  for (const rep of repRows) {
    // Each rep works with 3–8 subs in their region
    const regionSubs = subRows.filter(s => s.region === rep.region);
    const otherSubs = subRows.filter(s => s.region !== rep.region);
    const numLocal = rand(3, Math.min(6, regionSubs.length));
    const numOther = rand(0, 2);
    const assignedSubs = [
      ...pickN(regionSubs, numLocal),
      ...pickN(otherSubs, numOther),
    ];
    const repEqTypes = pickN(allEqTypes, rand(2, 4));

    for (const sub of assignedSubs) {
      for (const eqTypeId of repEqTypes) {
        if (Math.random() < 0.6) { // not every sub buys every eq type
          relRecords.push({
            rep_id: rep.id,
            subcontractor_id: sub.id,
            manufacturer_id: carrierId,
            equipment_type_id: eqTypeId,
            annual_volume_usd: rand(120000, 3800000),
            project_count: rand(2, 24),
            relationship_strength: pick(relStrengths) as string,
            year: 2025,
          });
        }
      }
    }
  }

  for (let i = 0; i < relRecords.length; i += BATCH) {
    await db.insert(schema.rep_subcontractor_relationships).values(relRecords.slice(i, i + BATCH));
  }
  console.log(`  ✓ ${relRecords.length} rep-subcontractor relationships`);

  console.log("\n✅ Seed complete!");
  console.log(`   Carrier ID: ${carrierId}`);
  console.log(`   Total mfgs: ${mfgRows.length} | Firms: ${firmRows.length} | Subs: ${subRows.length} | Reps: ${repRows.length}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
