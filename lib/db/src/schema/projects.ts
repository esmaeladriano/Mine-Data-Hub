import { pgTable, serial, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mineTypeEnum = pgEnum("mine_type", ["open_pit", "underground", "quarry", "alluvial"]);
export const projectStatusEnum = pgEnum("project_status", ["active", "inactive", "exploration", "closed"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  mineType: mineTypeEnum("mine_type").notNull(),
  status: projectStatusEnum("status").notNull().default("active"),
  area: numeric("area", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
