import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const productionUnitEnum = pgEnum("production_unit", ["tons", "m3", "kg"]);
export const shiftEnum = pgEnum("shift", ["day", "night", "full"]);

export const productionRecordsTable = pgTable("production_records", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  recordDate: timestamp("record_date").notNull(),
  material: text("material").notNull(),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  unit: productionUnitEnum("unit").notNull(),
  area: text("area"),
  shift: shiftEnum("shift").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductionRecordSchema = createInsertSchema(productionRecordsTable).omit({ id: true, createdAt: true });
export type InsertProductionRecord = z.infer<typeof insertProductionRecordSchema>;
export type ProductionRecord = typeof productionRecordsTable.$inferSelect;
