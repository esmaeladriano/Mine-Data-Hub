import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const fileTypeEnum = pgEnum("file_type", ["dwg", "dxf", "shp", "csv", "orthomosaic", "point_cloud", "dem", "geotiff"]);
export const surveyMethodEnum = pgEnum("survey_method", ["drone", "gps", "total_station", "lidar", "satellite"]);
export const surveyStatusEnum = pgEnum("survey_status", ["processing", "completed", "error"]);

export const surveysTable = pgTable("surveys", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  surveyDate: timestamp("survey_date").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileName: text("file_name"),
  surveyMethod: surveyMethodEnum("survey_method").notNull(),
  notes: text("notes"),
  status: surveyStatusEnum("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSurveySchema = createInsertSchema(surveysTable).omit({ id: true, createdAt: true });
export type InsertSurvey = z.infer<typeof insertSurveySchema>;
export type Survey = typeof surveysTable.$inferSelect;
