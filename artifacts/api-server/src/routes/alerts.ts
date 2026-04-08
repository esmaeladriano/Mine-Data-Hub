import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable, activityTable, projectsTable } from "@workspace/db";
import {
  CreateAlertBody,
  UpdateAlertBody,
  GetAlertParams,
  UpdateAlertParams,
  ListAlertsQueryParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const params = ListAlertsQueryParams.parse({
    projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
    status: req.query.status as string | undefined,
  });

  const conditions = [];
  if (params.projectId) {
    conditions.push(eq(alertsTable.projectId, params.projectId));
  }
  if (params.status) {
    conditions.push(eq(alertsTable.status, params.status as "active" | "resolved" | "dismissed"));
  }

  const alerts = conditions.length > 0
    ? await db.select().from(alertsTable).where(and(...conditions)).orderBy(alertsTable.createdAt)
    : await db.select().from(alertsTable).orderBy(alertsTable.createdAt);

  const result = alerts.map((a) => ({
    ...a,
    latitude: a.latitude ? parseFloat(a.latitude) : null,
    longitude: a.longitude ? parseFloat(a.longitude) : null,
  }));

  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateAlertBody.parse(req.body);
  const [alert] = await db
    .insert(alertsTable)
    .values({
      ...body,
      latitude: body.latitude !== undefined && body.latitude !== null ? String(body.latitude) : null,
      longitude: body.longitude !== undefined && body.longitude !== null ? String(body.longitude) : null,
    })
    .returning();

  const [project] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, body.projectId));

  await db.insert(activityTable).values({
    type: "alert_created",
    description: `${body.severity.toUpperCase()} alert: "${body.title}"`,
    projectName: project?.name ?? null,
  });

  res.status(201).json({
    ...alert,
    latitude: alert.latitude ? parseFloat(alert.latitude) : null,
    longitude: alert.longitude ? parseFloat(alert.longitude) : null,
  });
});

router.get("/:id", async (req, res) => {
  const { id } = GetAlertParams.parse({ id: parseInt(req.params.id) });
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({
    ...alert,
    latitude: alert.latitude ? parseFloat(alert.latitude) : null,
    longitude: alert.longitude ? parseFloat(alert.longitude) : null,
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateAlertParams.parse({ id: parseInt(req.params.id) });
  const body = UpdateAlertBody.parse(req.body);

  const updateData: Record<string, unknown> = { ...body };
  if (body.status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  const [alert] = await db
    .update(alertsTable)
    .set(updateData)
    .where(eq(alertsTable.id, id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({
    ...alert,
    latitude: alert.latitude ? parseFloat(alert.latitude) : null,
    longitude: alert.longitude ? parseFloat(alert.longitude) : null,
  });
});

export default router;
