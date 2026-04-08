import { Router } from "express";
import { db } from "@workspace/db";
import { volumeCalculationsTable, activityTable, projectsTable } from "@workspace/db";
import {
  CreateVolumeCalculationBody,
  GetVolumeCalculationParams,
  ListVolumesQueryParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const params = ListVolumesQueryParams.parse({
    projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
  });

  const conditions = [];
  if (params.projectId) {
    conditions.push(eq(volumeCalculationsTable.projectId, params.projectId));
  }

  const volumes = conditions.length > 0
    ? await db.select().from(volumeCalculationsTable).where(and(...conditions)).orderBy(volumeCalculationsTable.calculatedAt)
    : await db.select().from(volumeCalculationsTable).orderBy(volumeCalculationsTable.calculatedAt);

  const result = volumes.map((v) => ({
    ...v,
    excavatedVolume: parseFloat(v.excavatedVolume),
    fillVolume: parseFloat(v.fillVolume),
    netVolume: parseFloat(v.netVolume),
  }));

  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateVolumeCalculationBody.parse(req.body);
  const [volume] = await db
    .insert(volumeCalculationsTable)
    .values({
      ...body,
      excavatedVolume: String(body.excavatedVolume),
      fillVolume: String(body.fillVolume),
      netVolume: String(body.netVolume),
    })
    .returning();

  const [project] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, body.projectId));

  await db.insert(activityTable).values({
    type: "volume_calculated",
    description: `Volume calculation "${volume.name}" completed: ${body.netVolume.toFixed(2)} m³ net`,
    projectName: project?.name ?? null,
  });

  res.status(201).json({
    ...volume,
    excavatedVolume: parseFloat(volume.excavatedVolume),
    fillVolume: parseFloat(volume.fillVolume),
    netVolume: parseFloat(volume.netVolume),
  });
});

router.get("/:id", async (req, res) => {
  const { id } = GetVolumeCalculationParams.parse({ id: parseInt(req.params.id) });
  const [volume] = await db.select().from(volumeCalculationsTable).where(eq(volumeCalculationsTable.id, id));
  if (!volume) {
    res.status(404).json({ error: "Volume calculation not found" });
    return;
  }
  res.json({
    ...volume,
    excavatedVolume: parseFloat(volume.excavatedVolume),
    fillVolume: parseFloat(volume.fillVolume),
    netVolume: parseFloat(volume.netVolume),
  });
});

export default router;
