import { Router } from "express";
import { requireAuth, requireProjectRole } from "../auth/authMiddleware.js";
import { validateBody, validateQuery } from "../http/validate.js";
import { createTaskSchema, updateTaskSchema, taskListQuerySchema } from "./taskSchemas.js";
import * as service from "./taskService.js";

export const taskRoutes = Router({ mergeParams: true });

taskRoutes.post(
  "/",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  validateBody(createTaskSchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const task = await service.createTask({
        projectId,
        createdBy: req.user!.id,
        creatorRole: req.user!.role,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        assigneeId: req.body.assigneeId ?? undefined,
        dueDate: req.body.dueDate ?? undefined
      });
      res.status(201).json({ task });
    } catch (e) {
      next(e);
    }
  }
);

taskRoutes.get(
  "/",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  validateQuery(taskListQuerySchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const q = (req.validated?.query ?? {}) as any;
      const tasks = await service.listTasks({
        projectId,
        status: q.status,
        assigneeId: q.assigneeId,
        dueBefore: q.dueBefore,
        dueAfter: q.dueAfter,
        q: q.q
      });
      res.json({ tasks });
    } catch (e) {
      next(e);
    }
  }
);

taskRoutes.get(
  "/:taskId",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const task = await service.getTask(projectId, taskId);
      res.json({ task });
    } catch (e) {
      next(e);
    }
  }
);

taskRoutes.patch(
  "/:taskId",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  validateBody(updateTaskSchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      const task = await service.updateTask({
        projectId,
        taskId,
        creatorRole: req.user!.role,
        patch: {
          title: req.body.title,
          description: req.body.description,
          status: req.body.status,
          priority: req.body.priority,
          assigneeId: req.body.assigneeId,
          dueDate: req.body.dueDate
        }
      });
      res.json({ task });
    } catch (e) {
      next(e);
    }
  }
);

taskRoutes.delete(
  "/:taskId",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const taskId = String(req.params.taskId);
      await service.deleteTask(projectId, taskId);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

