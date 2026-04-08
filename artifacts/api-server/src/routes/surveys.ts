import { Router } from "express";
import { db } from "@workspace/db";
import { surveysTable, activityTable, projectsTable } from "@workspace/db";
import {
  CreateSurveyBody,
  GetSurveyParams,
  DeleteSurveyParams,
  ListSurveysQueryParams,
} from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const params = ListSurveysQueryParams.parse({
    projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
  });

  const conditions = [];
  if (params.projectId) {
    conditions.push(eq(surveysTable.projectId, params.projectId));
  }

  const surveys = conditions.length > 0
    ? await db.select().from(surveysTable).where(and(...conditions)).orderBy(surveysTable.surveyDate)
    : await db.select().from(surveysTable).orderBy(surveysTable.surveyDate);

  res.json(surveys);
});

router.post("/", async (req, res) => {
  const body = CreateSurveyBody.parse(req.body);
  const [survey] = await db
    .insert(surveysTable)
    .values({
      ...body,
      surveyDate: new Date(body.surveyDate),
    })
    .returning();

  const [project] = await db.select({ name: projectsTable.name }).from(projectsTable).where(eq(projectsTable.id, body.projectId));

  await db.insert(activityTable).values({
    type: "survey_uploaded",
    description: `Survey "${survey.name}" was uploaded (${survey.fileType.toUpperCase()})`,
    projectName: project?.name ?? null,
  });

  res.status(201).json(survey);
});

router.get("/:id", async (req, res) => {
  const { id } = GetSurveyParams.parse({ id: parseInt(req.params.id) });
  const [survey] = await db.select().from(surveysTable).where(eq(surveysTable.id, id));
  if (!survey) {
    res.status(404).json({ error: "Survey not found" });
    return;
  }
  res.json(survey);
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteSurveyParams.parse({ id: parseInt(req.params.id) });
  await db.delete(surveysTable).where(eq(surveysTable.id, id));
  res.status(204).send();
});

export default router;
