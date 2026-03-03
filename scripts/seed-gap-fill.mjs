/**
 * Gap-fill seed — ensures EVERY manufacturer has:
 * 1. Pricing records (multiple eq types, multiple regions)
 * 2. BOD records for at least 5 engineering firms
 * 3. Spec activity (mix of won/lost/pending) — minimum 15 per manufacturer
 * 4. At least one rep-subcontractor relationship
 *
 * Run after base + competitive seeds.
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql, eq, and, inArray } from "drizzle-orm";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN   = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

// Raw SQL helpers (no ORM schema needed)
async function q(query, args = []) {
  return client.execute({ sql: query, args });
}
async function all(query, args = []) {
  const r = await q(query, args);
  return r.rows;
}
async function one(query, args = []) {
  const r = await all(query, args);
  return r[0] ?? null;
}

function rand(min, max) { return Math.round(Math.random() * (max - min) + min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) { return [...arr].sort(() => Math.random()-0.5).slice(0, n); }

const REGIONS = ["Northeast", "Southeast", "Midwest", "West", "Southwest"];

const PROJECT_ADJ  = ["Summit","Metro","Nexus","Apex","Harbor","Meridian","Gateway","Legacy","Pinnacle","Horizon","Central","Civic","Premier","Heritage","Landmark","Pacific","Atlantic","Greenfield","Riverside","Uptown"];
const PROJECT_TYPE = ["Tower","Medical Center","Data Center","Campus","Mixed-Use Development","Hotel & Conference","Corporate HQ","Research Facility","Government Center","Innovation Park","Office Complex","Logistics Hub"];

const CITY_MAP = {
  Northeast: [["New York","NY"],["Boston","MA"],["Philadelphia","PA"],["Hartford","CT"],["Newark","NJ"]],
  Southeast: [["Atlanta","GA"],["Charlotte","NC"],["Miami","FL"],["Nashville","TN"],["Raleigh","NC"]],
  Midwest:   [["Chicago","IL"],["Detroit","MI"],["Minneapolis","MN"],["Columbus","OH"],["St. Louis","MO"]],
  West:      [["Los Angeles","CA"],["Seattle","WA"],["San Francisco","CA"],["Portland","OR"],["Denver","CO"]],
  Southwest: [["Dallas","TX"],["Houston","TX"],["Phoenix","AZ"],["Las Vegas","NV"],["Austin","TX"]],
};

function randomDate(y1=2023, y2=2025) {
  const s = new Date(y1,0,1).getTime(), e = new Date(y2,11,31).getTime();
  return new Date(s + Math.random()*(e-s)).toISOString().split("T")[0];
}

const BATCH = 40;
async function batchInsert(table, cols, rows) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const placeholders = chunk.map((_, ri) =>
      `(${cols.map((_,ci) => `?`).join(",")})`
    ).join(",");
    const vals = chunk.flatMap(r => cols.map(c => r[c] ?? null));
    await q(`INSERT INTO ${table} (${cols.join(",")}) VALUES ${placeholders}`, vals);
  }
}

async function run() {
  console.log("🔍 Auditing manufacturer data coverage...\n");

  // --- Load reference data ---
  const mfgs     = await all("SELECT id, name FROM manufacturers ORDER BY id");
  const eqTypes  = await all("SELECT id, name, size_unit FROM equipment_types");
  const firms    = await all("SELECT id, name, city, state, region FROM engineering_firms");
  const reps     = await all("SELECT id, rep_name, region FROM rep_territories WHERE manufacturer_id = 1");
  const subs     = await all("SELECT id, name, region, specialty FROM subcontractors");

  const mfgMap   = Object.fromEntries(mfgs.map(m => [m.name, Number(m.id)]));
  const eqMap    = Object.fromEntries(eqTypes.map(e => [e.name, { id: Number(e.id), unit: e.size_unit }]));

  // Get count summaries per manufacturer
  const specCounts  = await all("SELECT manufacturer_id, count(*) as c FROM spec_activity GROUP BY manufacturer_id");
  const priceCounts = await all("SELECT manufacturer_id, count(*) as c FROM equipment_pricing GROUP BY manufacturer_id");
  const bodCounts   = await all("SELECT manufacturer_id, count(distinct engineering_firm_id) as c FROM basis_of_design GROUP BY manufacturer_id");
  const relCounts   = await all("SELECT manufacturer_id, count(*) as c FROM rep_subcontractor_relationships GROUP BY manufacturer_id");

  const specMap  = Object.fromEntries(specCounts.map(r  => [Number(r.manufacturer_id), Number(r.c)]));
  const priceMap = Object.fromEntries(priceCounts.map(r => [Number(r.manufacturer_id), Number(r.c)]));
  const bodMap   = Object.fromEntries(bodCounts.map(r   => [Number(r.manufacturer_id), Number(r.c)]));
  const relMap   = Object.fromEntries(relCounts.map(r   => [Number(r.manufacturer_id), Number(r.c)]));

  console.log("Current coverage:");
  for (const m of mfgs) {
    const mid = Number(m.id);
    console.log(`  ${m.name.padEnd(35)} specs:${(specMap[mid]||0).toString().padStart(4)}  pricing:${(priceMap[mid]||0).toString().padStart(4)}  bod_firms:${(bodMap[mid]||0).toString().padStart(3)}  sub_rels:${(relMap[mid]||0).toString().padStart(3)}`);
  }

  // ─── Find base eq type IDs ────────────────────────────────────────────────
  const chillerId = eqMap["Chiller"]?.id      ?? eqMap["Chiller — Air-Cooled"]?.id;
  const ahuId     = eqMap["Air Handler (AHU)"]?.id ?? eqMap["Custom Air Handler"]?.id;
  const rtuId     = eqMap["Rooftop Unit (RTU)"]?.id;
  const vrfId     = eqMap["VRF System"]?.id   ?? eqMap["VRF / VRV System"]?.id;
  const hpId      = eqMap["Heat Pump"]?.id    ?? eqMap["Heat Pump — Air Source"]?.id;
  const boilerId  = eqMap["Boiler"]?.id       ?? eqMap["Boiler — Condensing"]?.id;
  const pumpId    = eqMap["Pump"]?.id         ?? eqMap["Pump — Chilled Water"]?.id;
  const ctId      = eqMap["Cooling Tower"]?.id ?? eqMap["Cooling Tower — Open Circuit"]?.id;
  const fanCoilId = eqMap["Fan Coil Unit"]?.id;
  const doasId    = eqMap["DOAS Unit"]?.id;

  const allEqIds = eqTypes.map(e => Number(e.id));

  // ─── 1. Fill pricing gaps (< 20 records) ─────────────────────────────────
  console.log("\n📦 Filling pricing gaps...");
  const pricingToInsert = [];

  // Pricing specs per manufacturer ($/unit base, spread, for common eq types)
  const mfgPricingConfig = {
    "Weil-McLain":              [{ eqId: boilerId,  unit:"MBH",  base: 22,  spread: 6,   sizes:[500,750,1000,1500,2000] }],
    "Armstrong Fluid Technology":[{ eqId: pumpId,    unit:"GPM",  base: 43,  spread: 12,  sizes:[50,100,200,300,500,750] }],
    "Bell & Gossett (Xylem)":   [{ eqId: pumpId,    unit:"GPM",  base: 40,  spread: 10,  sizes:[50,100,200,300,500,750,1000] }],
    "Baltimore Aircoil (BAC)":  [{ eqId: ctId,      unit:"tons", base: 90,  spread: 25,  sizes:[100,200,300,500,750,1000] }],
    "Marley / SPX Cooling":     [{ eqId: ctId,      unit:"tons", base: 80,  spread: 22,  sizes:[100,200,300,500,750,1000] }],
    "Evapco":                   [{ eqId: ctId,      unit:"tons", base: 74,  spread: 20,  sizes:[100,200,300,500,750,1000] }],
    "Daikin (VRF)":             [{ eqId: vrfId,     unit:"tons", base: 405, spread: 75,  sizes:[2,4,6,8,10,15,20,30,40,48] }],
    "Multistack":               [{ eqId: chillerId, unit:"tons", base: 640, spread: 130, sizes:[50,100,150,200,300] }],
    "Greenheck":                [{ eqId: ahuId,     unit:"CFM",  base: 3.0, spread: 0.8, sizes:[2000,5000,8000,12000,20000,30000] }],
    "Price Industries":         [{ eqId: ahuId,     unit:"CFM",  base: 2.9, spread: 0.7, sizes:[2000,5000,8000,12000,20000,30000] },
                                 { eqId: fanCoilId, unit:"CFM",  base: 1.5, spread: 0.4, sizes:[200,400,600,800,1000,1200] }],
    "McQuay / Daikin":          [{ eqId: chillerId, unit:"tons", base: 490, spread: 105, sizes:[50,100,200,300,500,750] }],
    "Bosch HVAC":               [{ eqId: hpId,      unit:"tons", base: 290, spread: 55,  sizes:[2,3,4,5,7.5,10,15,20] },
                                 { eqId: boilerId,  unit:"MBH",  base: 24,  spread: 6,   sizes:[500,750,1000,1500,2000] }],
    "Mitsubishi Electric":      [{ eqId: vrfId,     unit:"tons", base: 420, spread: 80,  sizes:[2,4,6,8,10,15,20,30,40] }],
  };

  for (const m of mfgs) {
    const mid = Number(m.id);
    if ((priceMap[mid] ?? 0) >= 20) continue; // already has enough

    const cfgs = mfgPricingConfig[m.name];
    if (!cfgs) {
      // Generic: use chiller + AHU
      if (!chillerId || !ahuId) continue;
      const configs = [
        { eqId: chillerId, unit: "tons", base: 500, spread: 100, sizes: [50,100,200,300,500] },
        { eqId: ahuId,     unit: "CFM",  base: 3.5, spread: 1.0, sizes: [2000,5000,12000,30000] },
      ];
      for (const cfg of configs) {
        if (!cfg.eqId) continue;
        for (const region of REGIONS) {
          const rMult = region === "Northeast" ? 1.12 : region === "West" ? 1.08 : region === "Southwest" ? 0.96 : region === "Southeast" ? 0.98 : 1.0;
          for (const year of [2023, 2024, 2025]) {
            const yMult = 1 + (year - 2022) * 0.04;
            for (const size of pickN(cfg.sizes, Math.min(3, cfg.sizes.length))) {
              const ppu = (cfg.base + (Math.random()-0.5)*cfg.spread*2) * rMult * yMult;
              pricingToInsert.push({
                manufacturer_id: mid, equipment_type_id: cfg.eqId,
                model_name: `${m.name.split(" ")[0].substring(0,5).toUpperCase()}-${cfg.unit}-${size}`,
                size_value: size, size_unit: cfg.unit,
                price_usd: Math.round(ppu * size), region, year,
              });
            }
          }
        }
      }
      continue;
    }

    for (const cfg of cfgs) {
      if (!cfg.eqId) continue;
      for (const region of REGIONS) {
        const rMult = region === "Northeast" ? 1.12 : region === "West" ? 1.08 : region === "Southwest" ? 0.96 : region === "Southeast" ? 0.98 : 1.0;
        for (const year of [2023, 2024, 2025]) {
          const yMult = 1 + (year - 2022) * 0.04;
          for (const size of pickN(cfg.sizes, Math.min(4, cfg.sizes.length))) {
            const ppu = (cfg.base + (Math.random()-0.5)*cfg.spread*2) * rMult * yMult;
            pricingToInsert.push({
              manufacturer_id: mid, equipment_type_id: cfg.eqId,
              model_name: `${m.name.split(" ")[0].substring(0,5).toUpperCase()}-${year}-${size}${cfg.unit.substring(0,3)}`,
              size_value: size, size_unit: cfg.unit,
              price_usd: Math.round(ppu * size), region, year,
            });
          }
        }
      }
    }
  }

  if (pricingToInsert.length > 0) {
    await batchInsert("equipment_pricing",
      ["manufacturer_id","equipment_type_id","model_name","size_value","size_unit","price_usd","region","year"],
      pricingToInsert);
    console.log(`  ✓ Added ${pricingToInsert.length} pricing records`);
  } else {
    console.log("  ✓ All manufacturers have adequate pricing records");
  }

  // ─── 2. Fill BOD gaps (< 5 firms covered) ────────────────────────────────
  console.log("\n📊 Filling BOD gaps...");
  const bodToInsert = [];

  // BOD weights per manufacturer (what % they typically get per firm)
  const mfgBodStrength = {
    "Carrier": 0.30, "Trane Technologies": 0.28, "Daikin Applied": 0.22,
    "Johnson Controls": 0.20, "York (JCI)": 0.18, "Lennox Commercial": 0.16,
    "Mitsubishi Electric": 0.24, "Bosch HVAC": 0.14, "McQuay / Daikin": 0.18,
    "Multistack": 0.35, "Greenheck": 0.22, "Price Industries": 0.28,
    "Weil-McLain": 0.40, "Armstrong Fluid Technology": 0.38, "Bell & Gossett (Xylem)": 0.42,
    "Baltimore Aircoil (BAC)": 0.36, "Marley / SPX Cooling": 0.30, "Evapco": 0.26,
    "Daikin (VRF)": 0.30,
  };

  // For each manufacturer with < 5 BOD firms, add BOD for a random set of firms
  for (const m of mfgs) {
    const mid = Number(m.id);
    const currentFirms = bodMap[mid] ?? 0;
    if (currentFirms >= 5) continue;

    // Get which firms already have BOD for this mfg
    const existing = await all("SELECT DISTINCT engineering_firm_id FROM basis_of_design WHERE manufacturer_id = ?", [mid]);
    const existingFirmIds = new Set(existing.map(r => Number(r.engineering_firm_id)));

    const needed = Math.max(0, 8 - currentFirms);
    const available = firms.filter(f => !existingFirmIds.has(Number(f.id)));
    const targets = pickN(available, Math.min(needed, available.length));

    const strength = mfgBodStrength[m.name] ?? 0.20;
    // Pick the most appropriate eq type for this manufacturer
    const relevantEqIds = allEqIds.slice(0, 4); // use first 4 eq types

    for (const firm of targets) {
      for (const year of [2023, 2024, 2025]) {
        for (const eqId of pickN(relevantEqIds, 2)) {
          const jitter = (Math.random() - 0.5) * 0.12;
          const bod_pct = Math.max(5, Math.min(65, Math.round((strength + jitter) * 100)));
          bodToInsert.push({
            engineering_firm_id: Number(firm.id),
            manufacturer_id: mid,
            equipment_type_id: eqId,
            bod_percentage: bod_pct,
            project_count: rand(2, 15),
            year,
            region: firm.region,
          });
        }
      }
    }
  }

  if (bodToInsert.length > 0) {
    await batchInsert("basis_of_design",
      ["engineering_firm_id","manufacturer_id","equipment_type_id","bod_percentage","project_count","year","region"],
      bodToInsert);
    console.log(`  ✓ Added ${bodToInsert.length} BOD records`);
  } else {
    console.log("  ✓ All manufacturers have adequate BOD coverage");
  }

  // ─── 3. Fill spec activity gaps (< 15 specs per manufacturer) ────────────
  console.log("\n⚡ Filling spec activity gaps...");
  const specToInsert = [];
  const STATUSES = ["won","won","won","lost","lost","pending","pending"];

  for (const m of mfgs) {
    const mid = Number(m.id);
    const current = specMap[mid] ?? 0;
    const target = 18;
    if (current >= target) continue;

    const needed = target - current;
    for (let i = 0; i < needed; i++) {
      const region = pick(REGIONS);
      const [city, state] = pick(CITY_MAP[region]);
      const regionFirms = firms.filter(f => f.region === region);
      const firm = pick(regionFirms.length > 0 ? regionFirms : firms);
      const eqTypeId = pick(allEqIds);
      const status = pick(STATUSES);
      const projectName = `${city} ${pick(PROJECT_ADJ)} ${pick(PROJECT_TYPE)}`;

      specToInsert.push({
        project_name: projectName,
        engineering_firm_id: Number(firm.id),
        manufacturer_id: mid,
        equipment_type_id: eqTypeId,
        status,
        region,
        city,
        state,
        value_usd: rand(75000, 4500000),
        date: randomDate(2023, 2025),
      });
    }
  }

  if (specToInsert.length > 0) {
    await batchInsert("spec_activity",
      ["project_name","engineering_firm_id","manufacturer_id","equipment_type_id","status","region","city","state","value_usd","date"],
      specToInsert);
    console.log(`  ✓ Added ${specToInsert.length} spec activity records`);
  } else {
    console.log("  ✓ All manufacturers have adequate spec activity");
  }

  // ─── 4. Fill rep-subcontractor relationship gaps ──────────────────────────
  // Every manufacturer needs at least some sub relationships so the data model
  // shows real pipeline. We use the existing Carrier reps as a proxy — adding
  // cross-manufacturer equipment relationships to show competitive install base.
  console.log("\n🔗 Filling subcontractor relationship gaps...");
  const relToInsert = [];

  // Get Marcus Chen's rep id (rep 1) — he has full permissions
  const marcusRep = reps.find(r => r.rep_name === "Marcus Chen") ?? reps[0];
  if (!marcusRep) {
    console.log("  ⚠ No reps found — skipping sub relationship fill");
  } else {
    for (const m of mfgs) {
      const mid = Number(m.id);
      if ((relMap[mid] ?? 0) > 0) continue; // already has some

      // Add 3-5 sub relationships for this manufacturer via existing reps
      const targetReps = pickN(reps, Math.min(3, reps.length));
      for (const rep of targetReps) {
        const regionSubs = subs.filter(s => s.region === rep.region);
        const targetSubs = pickN(regionSubs.length > 0 ? regionSubs : subs, Math.min(3, 6));
        const eqTypeId = pick(allEqIds);

        for (const sub of targetSubs) {
          relToInsert.push({
            rep_id: Number(rep.id),
            subcontractor_id: Number(sub.id),
            manufacturer_id: mid,
            equipment_type_id: eqTypeId,
            annual_volume_usd: rand(80000, 2500000),
            project_count: rand(1, 18),
            relationship_strength: pick(["primary","secondary","occasional"]),
            year: 2025,
          });
        }
      }
    }
  }

  if (relToInsert.length > 0) {
    await batchInsert("rep_subcontractor_relationships",
      ["rep_id","subcontractor_id","manufacturer_id","equipment_type_id","annual_volume_usd","project_count","relationship_strength","year"],
      relToInsert);
    console.log(`  ✓ Added ${relToInsert.length} sub relationship records`);
  } else {
    console.log("  ✓ All manufacturers have subcontractor relationships");
  }

  // ─── Final summary ────────────────────────────────────────────────────────
  console.log("\n✅ Gap-fill complete! Final coverage:\n");
  const specCounts2  = await all("SELECT manufacturer_id, count(*) as c FROM spec_activity GROUP BY manufacturer_id");
  const priceCounts2 = await all("SELECT manufacturer_id, count(*) as c FROM equipment_pricing GROUP BY manufacturer_id");
  const bodCounts2   = await all("SELECT manufacturer_id, count(distinct engineering_firm_id) as c FROM basis_of_design GROUP BY manufacturer_id");
  const relCounts2   = await all("SELECT manufacturer_id, count(*) as c FROM rep_subcontractor_relationships GROUP BY manufacturer_id");
  const specMap2  = Object.fromEntries(specCounts2.map(r  => [Number(r.manufacturer_id), Number(r.c)]));
  const priceMap2 = Object.fromEntries(priceCounts2.map(r => [Number(r.manufacturer_id), Number(r.c)]));
  const bodMap2   = Object.fromEntries(bodCounts2.map(r   => [Number(r.manufacturer_id), Number(r.c)]));
  const relMap2   = Object.fromEntries(relCounts2.map(r   => [Number(r.manufacturer_id), Number(r.c)]));

  for (const m of mfgs) {
    const mid = Number(m.id);
    const specs   = specMap2[mid]  ?? 0;
    const pricing = priceMap2[mid] ?? 0;
    const bod     = bodMap2[mid]   ?? 0;
    const rels    = relMap2[mid]   ?? 0;
    const ok = specs >= 10 && pricing >= 10 && bod >= 3 && rels >= 1;
    const flag = ok ? "✅" : "⚠️ ";
    console.log(`  ${flag} ${m.name.padEnd(35)} specs:${specs.toString().padStart(4)}  pricing:${pricing.toString().padStart(4)}  bod_firms:${bod.toString().padStart(3)}  sub_rels:${rels.toString().padStart(3)}`);
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
