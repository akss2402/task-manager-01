import "dotenv/config";
import type { QueryResult } from "pg";
import { createPool } from "../db/pool.js";
import { MIGRATIONS_DIR } from "./_paths.js";
import fs from "node:fs/promises";

type MigrationRow = { filename: string; applied_at: string };

async function listMigrationFiles() {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.match(/^\d+_.*\.sql$/i))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  const pool = createPool();
  const client = await pool.connect();

  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    const files = await listMigrationFiles();
    const res = (await client.query(
      "select filename, applied_at from schema_migrations order by applied_at asc"
    )) as QueryResult<MigrationRow>;

    const applied = new Set(res.rows.map((r: MigrationRow) => r.filename));
    const pending = files.filter((f) => !applied.has(f));

    console.log(`Migrations dir: ${MIGRATIONS_DIR}`);
    console.log(`Applied: ${res.rows.length}`);
    for (const row of res.rows) console.log(`  ✔ ${row.filename} @ ${row.applied_at}`);
    console.log(`Pending: ${pending.length}`);
    for (const f of pending) console.log(`  • ${f}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Status failed:", e);
  process.exitCode = 1;
});

