import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { surveysTable } from "./surveys";

export const volumeMethodEnum = pgEnum("volume_method", ["tin", "grid", "cross_section"]);

export const volumeCalculationsTable = pgTable("volume_calculations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  survey1Id: integer("survey1_id").notNull().references(() => surveysTable.id),
  survey2Id: integer("survey2_id").notNull().references(() => surveysTable.id),
  excavatedVolume: numeric("excavated_volume", { precision: 15, scale: 3 }).notNull(),
  fillVolume: numeric("fill_volume", { precision: 15, scale: 3 }).notNull(),
  netVolume: numeric("net_volume", { precision: 15, scale: 3 }).notNull(),
  method: volumeMethodEnum("method").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertVolumeCalculationSchema = createInsertSchema(volumeCalculationsTable).omit({ id: true, calculatedAt: true });
export type InsertVolumeCalculation = z.infer<typeof insertVolumeCalculationSchema>;
export type VolumeCalculation = typeof volumeCalculationsTable.$inferSelect;
