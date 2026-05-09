import type { PoolClient } from "pg";
import { pool } from "../db/index.js";

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'member';
};

export async function findUserByEmail(email: string, client?: PoolClient) {
  const c = client ?? pool;
  const res = await c.query<DbUser>(
    "select id, name, email, password_hash, role from users where lower(email) = lower($1) limit 1",
    [email]
  );
  return res.rows[0] ?? null;
}

export async function findUserById(id: string, client?: PoolClient) {
  const c = client ?? pool;
  const res = await c.query<Omit<DbUser, "password_hash">>(
    "select id, name, email, role from users where id = $1 limit 1",
    [id]
  );
  return res.rows[0] ?? null;
}

export async function createUser(input: { name: string; email: string; passwordHash: string; role?: string }) {
  const res = await pool.query<{ id: string; name: string; email: string; role: string }>(
    `insert into users (name, email, password_hash, role)
     values ($1, $2, $3, $4)
     returning id, name, email, role`,
    [input.name, input.email, input.passwordHash, input.role ?? 'member']
  );
  return res.rows[0]!;
}

export async function insertRefreshToken(input: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await pool.query(
    `insert into refresh_tokens (id, user_id, token_hash, expires_at)
     values ($1, $2, $3, $4)`,
    [input.id, input.userId, input.tokenHash, input.expiresAt]
  );
}

export async function findRefreshTokenByHash(tokenHash: string) {
  const res = await pool.query<{
    id: string;
    user_id: string;
    revoked_at: Date | null;
    expires_at: Date;
  }>(
    `select id, user_id, revoked_at, expires_at
     from refresh_tokens
     where token_hash = $1
     limit 1`,
    [tokenHash]
  );
  return res.rows[0] ?? null;
}

export async function revokeRefreshTokenByHash(tokenHash: string) {
  await pool.query(
    `update refresh_tokens set revoked_at = now()
     where token_hash = $1 and revoked_at is null`,
    [tokenHash]
  );
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await pool.query(
    `update refresh_tokens set revoked_at = now()
     where user_id = $1 and revoked_at is null`,
    [userId]
  );
}

