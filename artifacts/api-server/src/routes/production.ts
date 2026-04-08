import { Router } from "express";
import { db } from "@workspace/db";
import { productionRecordsTable, activityTable, projectsTable } from "@workspace/db";
import {
  CreateProductionRecordBody,
  GetProductionRecordParams,
  ListProductionRecordsQueryParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

function parseRecord(r: typeof productionRecordsTable.$inferSelect) {
  return {
    ...r,
    quantity: parseFloat(r.quantity),
  };
}

router.get("/", async (req, res) => {
  const params = ListProductionRecordsQueryParams.parse({
    projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
  });

  const conditions = [];
  if (params.projectId) {
    conditions.push(eq(productionRecordsTable.projectId, params.projectId));
  }

  const records = conditions.length > 0
    ? await db.select().from(productionRecordsTable).where(and(...conditions)).orderBy(productionRecordsTable.recordDate)
    : await db.select().from(productionRecordsTable).orderBy(productionRecordsTable.recordDate);

  res.json(records.map(parseRecord));
});

router.post("/", async (req, res) => {
  const body = CreateProductionRecordBody.parse(req.body);
  const [record] = await db
    .insert(productionRecordsTable)
    .values({
      ...body,
      quantity: String(body.quantity),
      recordDate: new Date(body.recordDate),
    })
    .returning();

  const [project] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, body.projectId));

  await db.insert(activityTable).values({
    type: "production_recorded",
    description: `Production recorded: ${body.quantity} ${body.unit} of ${body.material}`,
    projectName: project?.name ?? null,
  });

  res.status(201).json(parseRecord(record));
});

router.get("/:id", async (req, res) => {
  const { id } = GetProductionRecordParams.parse({ id: parseInt(req.params.id) });
  const [record] = await db.select().from(productionRecordsTable).where(eq(productionRecordsTable.id, id));
  if (!record) {
    res.status(404).json({ error: "Production record not found" });
    return;
  }
  res.json(parseRecord(record));
});

export default router;
