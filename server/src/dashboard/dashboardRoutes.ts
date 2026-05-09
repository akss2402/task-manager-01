import { Router } from "express";
import { requireAuth, requireProjectRole } from "../auth/authMiddleware.js";
import * as service from "./dashboardService.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/overview", requireAuth, async (req, res, next) => {
  try {
    const stats = await service.getOverview(req.user!.id, req.user!.role);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

dashboardRoutes.get("/my-tasks", requireAuth, async (req, res, next) => {
  try {
    const tasks = await service.getMyTasks({
      userId: req.user!.id,
      role: req.user!.role,
      status: req.query.status as string,
      overdueOnly: req.query.overdueOnly === "true",
      projectId: req.query.projectId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    });
    res.json({ tasks });
  } catch (e) {
    next(e);
  }
});

dashboardRoutes.get(
  "/project/:projectId/stats",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  async (req, res, next) => {
    try {
      const stats = await service.getProjectStats(String(req.params.projectId));
      res.json(stats);
    } catch (e) {
      next(e);
    }
  }
);
