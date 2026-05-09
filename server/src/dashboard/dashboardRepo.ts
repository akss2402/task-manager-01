import { pool } from "../db/index.js";
import type { DbTask } from "../tasks/taskRepo.js";


export async function getOverviewStats(userId: string, role: string) {
  const isAdmin = role === 'admin';
  const filter = isAdmin ? '' : 'where assignee_id = $1';
  const params = isAdmin ? [] : [userId];

  const statusCounts = await pool.query<{ status: string; count: string }>(
    `select status, count(*) as count
     from tasks
     ${filter}
     group by status`,
    params
  );

  const overdueCount = await pool.query<{ count: string }>(
    `select count(*) as count
     from tasks
     where status != 'done'
       and due_date < now()
       ${isAdmin ? '' : 'and assignee_id = $1'}`,
    params
  );

  return {
    statusCounts: statusCounts.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>),
    overdueCount: parseInt(overdueCount.rows[0]?.count ?? "0", 10)
  };
}

export async function getMyTasks(input: {
  userId: string;
  role: string;
  status?: string;
  overdueOnly?: boolean;
  projectId?: string;
  limit?: number;
}) {
  const isAdmin = input.role === 'admin';
  const where: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (!isAdmin) {
    where.push(`assignee_id = $${idx++}`);
    values.push(input.userId);
  }

  if (input.status) {
    where.push(`status = $${idx++}`);
    values.push(input.status);
  }
  if (input.overdueOnly) {
    where.push(`status != 'done' and due_date < now()`);
  }
  if (input.projectId) {
    where.push(`project_id = $${idx++}`);
    values.push(input.projectId);
  }

  const whereClause = where.length > 0 ? `where ${where.join(" and ")}` : '';
  const limitClause = input.limit ? `limit ${input.limit}` : '';

  const res = await pool.query<DbTask>(
    `select id, project_id, title, description, status, priority, assignee_id, due_date, created_by, created_at, updated_at
     from tasks
     ${whereClause}
     order by due_date asc nulls last, created_at desc
     ${limitClause}`,
    values
  );
  return res.rows;
}

export async function getProjectStats(projectId: string) {
  const statusCounts = await pool.query<{ status: string; count: string }>(
    `select status, count(*) as count
     from tasks
     where project_id = $1
     group by status`,
    [projectId]
  );

  const overdueCount = await pool.query<{ count: string }>(
    `select count(*) as count
     from tasks
     where project_id = $1
       and status != 'done'
       and due_date < now()`,
    [projectId]
  );

  const unassignedCount = await pool.query<{ count: string }>(
    `select count(*) as count
     from tasks
     where project_id = $1
       and assignee_id is null`,
    [projectId]
  );

  return {
    statusCounts: statusCounts.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<string, number>),
    overdueCount: parseInt(overdueCount.rows[0]?.count ?? "0", 10),
    unassignedCount: parseInt(unassignedCount.rows[0]?.count ?? "0", 10)
  };
}
