import { pool } from "../db/index.js";

export type DbTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string | null;
  status?: DbTask["status"];
  priority?: DbTask["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
  createdBy: string;
}) {
  const res = await pool.query<DbTask>(
    `insert into tasks (project_id, title, description, status, priority, assignee_id, due_date, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, project_id, title, description, status, priority, assignee_id, due_date, created_by, created_at, updated_at`,
    [
      input.projectId,
      input.title,
      input.description ?? null,
      input.status ?? "todo",
      input.priority ?? "medium",
      input.assigneeId ?? null,
      input.dueDate ?? null,
      input.createdBy
    ]
  );
  return res.rows[0]!;
}

export async function getTaskForProject(taskId: string, projectId: string) {
  const res = await pool.query<DbTask>(
    `select id, project_id, title, description, status, priority, assignee_id, due_date, created_by, created_at, updated_at
     from tasks
     where id = $1 and project_id = $2
     limit 1`,
    [taskId, projectId]
  );
  return res.rows[0] ?? null;
}

export async function listTasks(input: {
  projectId: string;
  status?: DbTask["status"];
  assigneeId?: string;
  dueBefore?: string;
  dueAfter?: string;
  q?: string;
}) {
  const where: string[] = ["project_id = $1"];
  const values: unknown[] = [input.projectId];
  let idx = 2;

  if (input.status) {
    where.push(`status = $${idx++}`);
    values.push(input.status);
  }
  if (input.assigneeId) {
    where.push(`assignee_id = $${idx++}`);
    values.push(input.assigneeId);
  }
  if (input.dueBefore) {
    where.push(`due_date < $${idx++}`);
    values.push(input.dueBefore);
  }
  if (input.dueAfter) {
    where.push(`due_date > $${idx++}`);
    values.push(input.dueAfter);
  }
  if (input.q) {
    where.push(`(title ilike $${idx} or description ilike $${idx})`);
    values.push(`%${input.q}%`);
    idx++;
  }

  const res = await pool.query<DbTask>(
    `select id, project_id, title, description, status, priority, assignee_id, due_date, created_by, created_at, updated_at
     from tasks
     where ${where.join(" and ")}
     order by created_at desc`,
    values
  );
  return res.rows;
}

export async function updateTask(taskId: string, projectId: string, input: Partial<{
  title: string;
  description: string | null;
  status: DbTask["status"];
  priority: DbTask["priority"];
  assigneeId: string | null;
  dueDate: string | null;
}>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (typeof input.title !== "undefined") {
    fields.push(`title = $${idx++}`);
    values.push(input.title);
  }
  if (typeof input.description !== "undefined") {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (typeof input.status !== "undefined") {
    fields.push(`status = $${idx++}`);
    values.push(input.status);
  }
  if (typeof input.priority !== "undefined") {
    fields.push(`priority = $${idx++}`);
    values.push(input.priority);
  }
  if (typeof input.assigneeId !== "undefined") {
    fields.push(`assignee_id = $${idx++}`);
    values.push(input.assigneeId);
  }
  if (typeof input.dueDate !== "undefined") {
    fields.push(`due_date = $${idx++}`);
    values.push(input.dueDate);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(taskId, projectId);

  const res = await pool.query<DbTask>(
    `update tasks
     set ${fields.join(", ")}
     where id = $${idx++} and project_id = $${idx}
     returning id, project_id, title, description, status, priority, assignee_id, due_date, created_by, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

export async function deleteTask(taskId: string, projectId: string) {
  const res = await pool.query<{ id: string }>(
    `delete from tasks where id = $1 and project_id = $2 returning id`,
    [taskId, projectId]
  );
  return res.rows[0] ?? null;
}

export async function isProjectMember(projectId: string, userId: string) {
  const res = await pool.query<{ ok: boolean }>(
    `select true as ok from project_members where project_id = $1 and user_id = $2 limit 1`,
    [projectId, userId]
  );
  return Boolean(res.rows[0]?.ok);
}

