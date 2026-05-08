import pg from "pg";
import { getConfig } from "../config.js";

const { Pool } = pg;

export function createPool() {
  const { DATABASE_URL: connectionString } = getConfig();
  return new Pool({
    connectionString,
    // Neon requires SSL; the URL already includes sslmode=require, but this is safe.
    ssl: { rejectUnauthorized: false }
  });
}

