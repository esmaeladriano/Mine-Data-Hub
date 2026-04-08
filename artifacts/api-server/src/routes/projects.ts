import { Router } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  surveysTable,
  volumeCalculationsTable,
  alertsTable,
  productionRecordsTable,
  activityTable,
} from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  GetProjectSummaryParams,
} from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const projects = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
  const result = projects.map((p) => ({
    ...p,
    latitude: p.latitude ? parseFloat(p.latitude) : null,
    longitude: p.longitude ? parseFloat(p.longitude) : null,
    area: p.area ? parseFloat(p.area) : null,
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const [project] = await db
    .insert(projectsTable)
    .values({
      ...body,
      latitude: body.latitude !== undefined && body.latitude !== null ? String(body.latitude) : null,
      longitude: body.longitude !== undefined && body.longitude !== null ? String(body.longitude) : null,
      area: body.area !== undefined && body.area !== null ? String(body.area) : null,
    })
    .returning();

  await db.insert(activityTable).values({
    type: "project_created",
    description: `New mine project "${project.name}" was created`,
    projectName: project.name,
  });

  res.status(201).json({
    ...project,
    latitude: project.latitude ? parseFloat(project.latitude) : null,
    longitude: project.longitude ? parseFloat(project.longitude) : null,
    area: project.area ? parseFloat(project.area) : null,
  });
});

router.get("/:id", async (req, res) => {
  const { id } = GetProjectParams.parse({ id: parseInt(req.params.id) });
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({
    ...project,
    latitude: project.latitude ? parseFloat(project.latitude) : null,
    longitude: project.longitude ? parseFloat(project.longitude) : null,
    area: project.area ? parseFloat(project.area) : null,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateProjectParams.parse({ id: parseInt(req.params.id) });
  const body = UpdateProjectBody.parse(req.body);
  const [project] = await db
    .update(projectsTable)
    .set({
      ...body,
      latitude: body.latitude !== undefined && body.latitude !== null ? String(body.latitude) : undefined,
      longitude: body.longitude !== undefined && body.longitude !== null ? String(body.longitude) : undefined,
      area: body.area !== undefined && body.area !== null ? String(body.area) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(projectsTable.id, id))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({
    ...project,
    latitude: project.latitude ? parseFloat(project.latitude) : null,
    longitude: project.longitude ? parseFloat(project.longitude) : null,
    area: project.area ? parseFloat(project.area) : null,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteProjectParams.parse({ id: parseInt(req.params.id) });
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.status(204).send();
});

router.get("/:id/summary", async (req, res) => {
  const { id } = GetProjectSummaryParams.parse({ id: parseInt(req.params.id) });

  const [surveyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(surveysTable)
    .where(eq(surveysTable.projectId, id));

  const lastSurvey = await db
    .select({ surveyDate: surveysTable.surveyDate })
    .from(surveysTable)
    .where(eq(surveysTable.projectId, id))
    .orderBy(sql`survey_date desc`)
    .limit(1);

  const volumes = await db
    .select({ netVolume: volumeCalculationsTable.netVolume })
    .from(volumeCalculationsTable)
    .where(eq(volumeCalculationsTable.projectId, id));

  const totalVolumeExcavated = volumes.reduce((sum, v) => sum + parseFloat(v.netVolume), 0);

  const [alertCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(sql`${alertsTable.projectId} = ${id} AND ${alertsTable.status} = 'active'`);

  const productionRows = await db
    .select({ quantity: productionRecordsTable.quantity, unit: productionRecordsTable.unit })
    .from(productionRecordsTable)
    .where(eq(productionRecordsTable.projectId, id));

  const totalProduction = productionRows.reduce((sum, r) => sum + parseFloat(r.quantity), 0);
  const productionUnit = productionRows.length > 0 ? productionRows[0].unit : "tons";

  res.json({
    projectId: id,
    totalSurveys: surveyCount?.count ?? 0,
    lastSurveyDate: lastSurvey[0]?.surveyDate ?? null,
    totalVolumeExcavated,
    activeAlerts: alertCount?.count ?? 0,
    totalProduction,
    productionUnit,
  });
});

export default router;
