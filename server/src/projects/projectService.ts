import { HttpError } from "../http/errors.js";
import * as authRepo from "../auth/authRepo.js";
import * as repo from "./projectRepo.js";

export async function createProject(input: {
  userId: string;
  name: string;
  description?: string;
}) {
  return repo.createProjectWithCreatorMember(input);
}

export async function listProjects(userId: string) {
  return repo.listProjectsForUser(userId);
}

export async function getProject(projectId: string, userId: string) {
  const project = await repo.getProjectForMember(projectId, userId);
  if (!project) throw new HttpError(404, "Project not found", { code: "PROJECT_NOT_FOUND" });
  return project;
}

export async function updateProject(projectId: string, input: { name?: string; description?: string | null }) {
  const updated = await repo.updateProject(projectId, input);
  if (!updated) throw new HttpError(404, "Project not found", { code: "PROJECT_NOT_FOUND" });
  return updated;
}

export async function deleteProject(projectId: string) {
  const deleted = await repo.deleteProject(projectId);
  if (!deleted) throw new HttpError(404, "Project not found", { code: "PROJECT_NOT_FOUND" });
  return deleted;
}

export async function listProjectMembers(projectId: string) {
  return repo.listMembers(projectId);
}

export async function addMemberByEmail(input: {
  projectId: string;
  email: string;
  role: "admin" | "member";
}) {
  const user = await authRepo.findUserByEmail(input.email);
  if (!user) throw new HttpError(404, "User not found", { code: "USER_NOT_FOUND" });
  const member = await repo.upsertMember(input.projectId, user.id, input.role);
  return member;
}

export async function changeMemberRole(input: { projectId: string; userId: string; role: "admin" | "member" }) {
  const currentRole = await repo.findMemberRole(input.projectId, input.userId);
  if (!currentRole) throw new HttpError(404, "Member not found", { code: "MEMBER_NOT_FOUND" });

  if (currentRole === "admin" && input.role !== "admin") {
    const admins = await repo.countAdmins(input.projectId);
    if (admins <= 1) {
      throw new HttpError(400, "Project must have at least one admin", { code: "LAST_ADMIN" });
    }
  }

  return repo.upsertMember(input.projectId, input.userId, input.role);
}

export async function removeMember(input: { projectId: string; userId: string }) {
  const currentRole = await repo.findMemberRole(input.projectId, input.userId);
  if (!currentRole) throw new HttpError(404, "Member not found", { code: "MEMBER_NOT_FOUND" });

  if (currentRole === "admin") {
    const admins = await repo.countAdmins(input.projectId);
    if (admins <= 1) {
      throw new HttpError(400, "Project must have at least one admin", { code: "LAST_ADMIN" });
    }
  }

  const removed = await repo.removeMember(input.projectId, input.userId);
  if (!removed) throw new HttpError(404, "Member not found", { code: "MEMBER_NOT_FOUND" });
  return removed;
}

