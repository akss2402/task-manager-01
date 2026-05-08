import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import type { PoolClient, QueryResult } from "pg";
import { createPool } from "../db/pool.js";
import { MIGRATIONS_DIR } from "./_paths.js";

type MigrationRow = { filename: string; applied_at: string };

async function ensureMigrationsTable(client: PoolClient) {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.match(/^\d+_.*\.sql$/i))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const res = (await client.query(
    "select filename, applied_at from schema_migrations order by applied_at asc"
  )) as QueryResult<MigrationRow>;
  return new Set(res.rows.map((r: MigrationRow) => r.filename));
}

async function main() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await ensureMigrationsTable(client);

    const files = await listMigrationFiles();
    const applied = await getAppliedMigrations(client);

    const pending = files.filter((f) => !applied.has(f));
    if (pending.length === 0) {
      console.log("No pending migrations.");
      await client.query("commit");
      return;
    }

    for (const filename of pending) {
      const fullPath = path.join(MIGRATIONS_DIR, filename);
      const sql = await fs.readFile(fullPath, "utf8");

      console.log(`Applying ${filename}...`);
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
    }

    await client.query("commit");
    console.log(`Done. Applied ${pending.length} migration(s).`);
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exitCode = 1;
});

