import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const manufacturers = sqliteTable("manufacturers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  logo_url: text("logo_url"),
  hq_city: text("hq_city"),
  hq_state: text("hq_state"),
  annual_revenue: real("annual_revenue"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const equipment_types = sqliteTable("equipment_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  size_unit: text("size_unit").notNull(),
});

export const equipment_pricing = sqliteTable("equipment_pricing", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  manufacturer_id: integer("manufacturer_id").notNull(),
  equipment_type_id: integer("equipment_type_id").notNull(),
  model_name: text("model_name"),
  size_value: real("size_value").notNull(),
  size_unit: text("size_unit").notNull(),
  price_usd: real("price_usd").notNull(),
  region: text("region").notNull(),
  year: integer("year").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const engineering_firms = sqliteTable("engineering_firms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  region: text("region"),
  size_tier: text("size_tier"),
});

export const basis_of_design = sqliteTable("basis_of_design", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  engineering_firm_id: integer("engineering_firm_id").notNull(),
  manufacturer_id: integer("manufacturer_id").notNull(),
  equipment_type_id: integer("equipment_type_id").notNull(),
  bod_percentage: real("bod_percentage").notNull(),
  project_count: integer("project_count").notNull(),
  year: integer("year").notNull(),
  region: text("region"),
});

export const spec_activity = sqliteTable("spec_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_name: text("project_name").notNull(),
  engineering_firm_id: integer("engineering_firm_id").notNull(),
  manufacturer_id: integer("manufacturer_id").notNull(),
  equipment_type_id: integer("equipment_type_id").notNull(),
  status: text("status").notNull(),
  region: text("region").notNull(),
  city: text("city"),
  state: text("state"),
  value_usd: real("value_usd"),
  date: text("date").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const rep_territories = sqliteTable("rep_territories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rep_name: text("rep_name").notNull(),
  manufacturer_id: integer("manufacturer_id").notNull(),
  region: text("region").notNull(),
  city: text("city"),
  state: text("state"),
});

export const subcontractors = sqliteTable("subcontractors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  city: text("city"),
  state: text("state"),
  region: text("region").notNull(),
  specialty: text("specialty").notNull(),
  size_tier: text("size_tier").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const rep_subcontractor_relationships = sqliteTable("rep_subcontractor_relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rep_id: integer("rep_id").notNull(),
  subcontractor_id: integer("subcontractor_id").notNull(),
  manufacturer_id: integer("manufacturer_id").notNull(),
  equipment_type_id: integer("equipment_type_id").notNull(),
  annual_volume_usd: real("annual_volume_usd"),
  project_count: integer("project_count"),
  relationship_strength: text("relationship_strength").notNull(),
  year: integer("year").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const rep_permissions = sqliteTable("rep_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rep_id: integer("rep_id").notNull(),
  manufacturer_id: integer("manufacturer_id").notNull(),
  share_pricing: integer("share_pricing", { mode: "boolean" }).default(true),
  share_projects: integer("share_projects", { mode: "boolean" }).default(true),
  share_competitive: integer("share_competitive", { mode: "boolean" }).default(true),
  share_engineering: integer("share_engineering", { mode: "boolean" }).default(true),
  share_pipeline: integer("share_pipeline", { mode: "boolean" }).default(false),
  share_subcontractors: integer("share_subcontractors", { mode: "boolean" }).default(true),
  updated_at: text("updated_at").default(sql`(datetime('now'))`),
});
