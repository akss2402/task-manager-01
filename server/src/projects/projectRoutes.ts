import { Router } from "express";
import { requireAuth, requireProjectRole } from "../auth/authMiddleware.js";
import { validateBody } from "../http/validate.js";
import { createProjectSchema, updateProjectSchema, addMemberSchema, changeMemberRoleSchema } from "./projectSchemas.js";
import * as service from "./projectService.js";

export const projectRoutes = Router();

// Projects
projectRoutes.post("/", requireAuth, validateBody(createProjectSchema), async (req, res, next) => {
  try {
    const project = await service.createProject({
      userId: req.user!.id,
      name: req.body.name,
      description: req.body.description
    });
    res.status(201).json({ project });
  } catch (e) {
    next(e);
  }
});

projectRoutes.get("/", requireAuth, async (req, res, next) => {
  try {
    const projects = await service.listProjects(req.user!.id);
    res.json({ projects });
  } catch (e) {
    next(e);
  }
});

projectRoutes.get(
  "/:projectId",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const project = await service.getProject(projectId, req.user!.id);
      res.json({ project });
    } catch (e) {
      next(e);
    }
  }
);

projectRoutes.patch(
  "/:projectId",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  validateBody(updateProjectSchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const project = await service.updateProject(projectId, req.body);
      res.json({ project });
    } catch (e) {
      next(e);
    }
  }
);

projectRoutes.delete(
  "/:projectId",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      await service.deleteProject(projectId);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

// Members
projectRoutes.get(
  "/:projectId/members",
  requireAuth,
  requireProjectRole("projectId", ["admin", "member"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const members = await service.listProjectMembers(projectId);
      res.json({ members });
    } catch (e) {
      next(e);
    }
  }
);

projectRoutes.post(
  "/:projectId/members",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  validateBody(addMemberSchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const member = await service.addMemberByEmail({
        projectId,
        email: req.body.email,
        role: req.body.role ?? "member"
      });
      res.status(201).json({ member });
    } catch (e) {
      next(e);
    }
  }
);

projectRoutes.patch(
  "/:projectId/members/:userId",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  validateBody(changeMemberRoleSchema),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = String(req.params.userId);
      const member = await service.changeMemberRole({
        projectId,
        userId,
        role: req.body.role
      });
      res.json({ member });
    } catch (e) {
      next(e);
    }
  }
);

projectRoutes.delete(
  "/:projectId/members/:userId",
  requireAuth,
  requireProjectRole("projectId", ["admin"]),
  async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const userId = String(req.params.userId);
      await service.removeMember({ projectId, userId });
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
);

