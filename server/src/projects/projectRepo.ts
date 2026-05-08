import { pool } from "../db/index.js";

export type DbProject = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DbMember = {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  name: string;
  email: string;
};

export async function listProjectsForUser(userId: string) {
  const res = await pool.query<DbProject>(
    `select p.id, p.name, p.description, p.created_by, p.created_at, p.updated_at
     from projects p
     join project_members pm on pm.project_id = p.id
     where pm.user_id = $1
     order by p.created_at desc`,
    [userId]
  );
  return res.rows;
}

export async function getProjectForMember(projectId: string, userId: string) {
  const res = await pool.query<DbProject>(
    `select p.id, p.name, p.description, p.created_by, p.created_at, p.updated_at
     from projects p
     join project_members pm on pm.project_id = p.id
     where p.id = $1 and pm.user_id = $2
     limit 1`,
    [projectId, userId]
  );
  return res.rows[0] ?? null;
}

export async function createProjectWithCreatorMember(input: {
  userId: string;
  name: string;
  description?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const projectRes = await client.query<{ id: string; name: string; description: string | null }>(
      `insert into projects (name, description, created_by)
       values ($1, $2, $3)
       returning id, name, description`,
      [input.name, input.description ?? null, input.userId]
    );
    const project = projectRes.rows[0]!;
    await client.query(
      `insert into project_members (project_id, user_id, role)
       values ($1, $2, 'admin')`,
      [project.id, input.userId]
    );
    await client.query("commit");
    return project;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export async function updateProject(projectId: string, input: { name?: string; description?: string | null }) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  if (typeof input.name !== "undefined") {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (typeof input.description !== "undefined") {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (fields.length === 0) return null;

  fields.push(`updated_at = now()`);
  values.push(projectId);

  const res = await pool.query<DbProject>(
    `update projects
     set ${fields.join(", ")}
     where id = $${idx}
     returning id, name, description, created_by, created_at, updated_at`,
    values
  );
  return res.rows[0] ?? null;
}

export async function deleteProject(projectId: string) {
  const res = await pool.query<{ id: string }>("delete from projects where id = $1 returning id", [
    projectId
  ]);
  return res.rows[0] ?? null;
}

export async function listMembers(projectId: string) {
  const res = await pool.query<DbMember>(
    `select pm.user_id, pm.role, pm.joined_at, u.name, u.email
     from project_members pm
     join users u on u.id = pm.user_id
     where pm.project_id = $1
     order by pm.joined_at asc`,
    [projectId]
  );
  return res.rows;
}

export async function findMemberRole(projectId: string, userId: string) {
  const res = await pool.query<{ role: "admin" | "member" }>(
    `select role from project_members where project_id = $1 and user_id = $2 limit 1`,
    [projectId, userId]
  );
  return res.rows[0]?.role ?? null;
}

export async function countAdmins(projectId: string) {
  const res = await pool.query<{ count: string }>(
    `select count(*)::text as count
     from project_members
     where project_id = $1 and role = 'admin'`,
    [projectId]
  );
  return Number(res.rows[0]?.count ?? "0");
}

export async function upsertMember(projectId: string, userId: string, role: "admin" | "member") {
  // If already member, keep existing joined_at but update role.
  const res = await pool.query<{ project_id: string; user_id: string; role: "admin" | "member" }>(
    `insert into project_members (project_id, user_id, role)
     values ($1, $2, $3)
     on conflict (project_id, user_id)
     do update set role = excluded.role
     returning project_id, user_id, role`,
    [projectId, userId, role]
  );
  return res.rows[0]!;
}

export async function removeMember(projectId: string, userId: string) {
  const res = await pool.query<{ project_id: string; user_id: string }>(
    `delete from project_members
     where project_id = $1 and user_id = $2
     returning project_id, user_id`,
    [projectId, userId]
  );
  return res.rows[0] ?? null;
}

