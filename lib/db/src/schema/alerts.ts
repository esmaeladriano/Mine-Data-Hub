import { pgTable, serial, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const alertSeverityEnum = pgEnum("alert_severity", ["low", "medium", "high", "critical"]);
export const alertCategoryEnum = pgEnum("alert_category", ["slope_instability", "deformation", "seismic", "flooding", "equipment", "other"]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "resolved", "dismissed"]);

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: alertSeverityEnum("severity").notNull(),
  category: alertCategoryEnum("category").notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, resolvedAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
