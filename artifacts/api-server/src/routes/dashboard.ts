import { Router } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  surveysTable,
  alertsTable,
  usersTable,
  volumeCalculationsTable,
  productionRecordsTable,
  activityTable,
} from "@workspace/db";
import { sql, gte } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const [totalProjects] = await db.select({ count: sql<number>`count(*)::int` }).from(projectsTable);
  const [activeProjects] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projectsTable)
    .where(sql`status = 'active'`);

  const [totalSurveys] = await db.select({ count: sql<number>`count(*)::int` }).from(surveysTable);
  const [pendingSurveys] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(surveysTable)
    .where(sql`status = 'processing'`);

  const [activeAlerts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(sql`status = 'active'`);
  const [criticalAlerts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(alertsTable)
    .where(sql`status = 'active' AND severity = 'critical'`);

  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);

  const volumes = await db.select({ netVolume: volumeCalculationsTable.netVolume }).from(volumeCalculationsTable);
  const totalVolumeExcavated = volumes.reduce((sum, v) => sum + parseFloat(v.netVolume), 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const monthlyProductionRows = await db
    .select({ quantity: productionRecordsTable.quantity, unit: productionRecordsTable.unit })
    .from(productionRecordsTable)
    .where(gte(productionRecordsTable.recordDate, thirtyDaysAgo));

  const monthlyProduction = monthlyProductionRows.reduce((sum, r) => sum + parseFloat(r.quantity), 0);
  const productionUnit = monthlyProductionRows.length > 0 ? monthlyProductionRows[0].unit : "tons";

  res.json({
    totalProjects: totalProjects?.count ?? 0,
    activeProjects: activeProjects?.count ?? 0,
    totalSurveys: totalSurveys?.count ?? 0,
    pendingSurveys: pendingSurveys?.count ?? 0,
    activeAlerts: activeAlerts?.count ?? 0,
    criticalAlerts: criticalAlerts?.count ?? 0,
    totalUsers: totalUsers?.count ?? 0,
    totalVolumeExcavated,
    monthlyProduction,
    productionUnit,
  });
});

router.get("/activity", async (req, res) => {
  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(sql`created_at desc`)
    .limit(20);
  res.json(activities);
});

router.get("/production-chart", async (req, res) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let records;
  if (projectId) {
    records = await db
      .select()
      .from(productionRecordsTable)
      .where(
        sql`${productionRecordsTable.projectId} = ${projectId} AND ${productionRecordsTable.recordDate} >= ${thirtyDaysAgo}`
      )
      .orderBy(productionRecordsTable.recordDate);
  } else {
    records = await db
      .select()
      .from(productionRecordsTable)
      .where(gte(productionRecordsTable.recordDate, thirtyDaysAgo))
      .orderBy(productionRecordsTable.recordDate);
  }

  const result = records.map((r) => ({
    date: r.recordDate.toISOString().split("T")[0],
    quantity: parseFloat(r.quantity),
    material: r.material,
  }));

  res.json(result);
});

export default router;
