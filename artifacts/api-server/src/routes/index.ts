import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import surveysRouter from "./surveys";
import volumesRouter from "./volumes";
import alertsRouter from "./alerts";
import usersRouter from "./users";
import productionRouter from "./production";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/projects", projectsRouter);
router.use("/surveys", surveysRouter);
router.use("/volumes", volumesRouter);
router.use("/alerts", alertsRouter);
router.use("/users", usersRouter);
router.use("/production", productionRouter);
router.use("/dashboard", dashboardRouter);

export default router;
