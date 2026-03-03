import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const DDL = `
CREATE TABLE IF NOT EXISTS manufacturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo_url TEXT,
  hq_city TEXT,
  hq_state TEXT,
  annual_revenue REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipment_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  size_unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manufacturer_id INTEGER NOT NULL,
  equipment_type_id INTEGER NOT NULL,
  model_name TEXT,
  size_value REAL NOT NULL,
  size_unit TEXT NOT NULL,
  price_usd REAL NOT NULL,
  region TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS engineering_firms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  region TEXT,
  size_tier TEXT
);

CREATE TABLE IF NOT EXISTS basis_of_design (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  engineering_firm_id INTEGER NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  equipment_type_id INTEGER NOT NULL,
  bod_percentage REAL NOT NULL,
  project_count INTEGER NOT NULL,
  year INTEGER NOT NULL,
  region TEXT
);

CREATE TABLE IF NOT EXISTS spec_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  engineering_firm_id INTEGER NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  equipment_type_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  state TEXT,
  value_usd REAL,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rep_territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rep_name TEXT NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  region TEXT NOT NULL,
  city TEXT,
  state TEXT
);

CREATE TABLE IF NOT EXISTS subcontractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  region TEXT NOT NULL,
  specialty TEXT NOT NULL,
  size_tier TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rep_subcontractor_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rep_id INTEGER NOT NULL,
  subcontractor_id INTEGER NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  equipment_type_id INTEGER NOT NULL,
  annual_volume_usd REAL,
  project_count INTEGER,
  relationship_strength TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rep_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rep_id INTEGER NOT NULL,
  manufacturer_id INTEGER NOT NULL,
  share_pricing INTEGER DEFAULT 1,
  share_projects INTEGER DEFAULT 1,
  share_competitive INTEGER DEFAULT 1,
  share_engineering INTEGER DEFAULT 1,
  share_pipeline INTEGER DEFAULT 0,
  share_subcontractors INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

async function migrate() {
  console.log("Running migrations...");
  const statements = DDL.split(";").map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await client.execute(stmt + ";");
  }
  console.log("✅ Migrations complete");
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
