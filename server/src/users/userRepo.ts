import { pool } from "../db/index.js";

export async function getAllUsers() {
  const res = await pool.query<{ id: string; name: string; email: string; role: string; created_at: string }>(
    `select id, name, email, role, created_at from users order by name asc`
  );
  return res.rows;
}

export async function getUserStats(userId: string) {
  const res = await pool.query<{ total_tasks: number; completed_tasks: number }>(
    `select 
       count(*) as total_tasks,
       count(*) filter (where status = 'done') as completed_tasks
     from tasks 
     where assignee_id = $1`,
    [userId]
  );
  return res.rows[0];
}
