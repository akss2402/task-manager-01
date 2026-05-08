import { HttpError } from "../http/errors.js";
import * as repo from "./taskRepo.js";

export async function createTask(input: {
  projectId: string;
  createdBy: string;
  title: string;
  description?: string;
  status?: repo.DbTask["status"];
  priority?: repo.DbTask["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
}) {
  if (input.assigneeId) {
    const ok = await repo.isProjectMember(input.projectId, input.assigneeId);
    if (!ok) {
      throw new HttpError(400, "Assignee must be a member of the project", {
        code: "ASSIGNEE_NOT_MEMBER"
      });
    }
  }
  return repo.createTask(input);
}

export async function listTasks(input: {
  projectId: string;
  status?: repo.DbTask["status"];
  assigneeId?: string;
  dueBefore?: string;
  dueAfter?: string;
  q?: string;
}) {
  return repo.listTasks(input);
}

export async function getTask(projectId: string, taskId: string) {
  const task = await repo.getTaskForProject(taskId, projectId);
  if (!task) throw new HttpError(404, "Task not found", { code: "TASK_NOT_FOUND" });
  return task;
}

export async function updateTask(input: {
  projectId: string;
  taskId: string;
  patch: Partial<{
    title: string;
    description: string | null;
    status: repo.DbTask["status"];
    priority: repo.DbTask["priority"];
    assigneeId: string | null;
    dueDate: string | null;
  }>;
}) {
  if (typeof input.patch.assigneeId !== "undefined" && input.patch.assigneeId !== null) {
    const ok = await repo.isProjectMember(input.projectId, input.patch.assigneeId);
    if (!ok) {
      throw new HttpError(400, "Assignee must be a member of the project", {
        code: "ASSIGNEE_NOT_MEMBER"
      });
    }
  }
  const updated = await repo.updateTask(input.taskId, input.projectId, input.patch);
  if (!updated) throw new HttpError(404, "Task not found", { code: "TASK_NOT_FOUND" });
  return updated;
}

export async function deleteTask(projectId: string, taskId: string) {
  const deleted = await repo.deleteTask(taskId, projectId);
  if (!deleted) throw new HttpError(404, "Task not found", { code: "TASK_NOT_FOUND" });
  return deleted;
}

