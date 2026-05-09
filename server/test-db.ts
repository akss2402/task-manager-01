import { pool } from "./src/db/index.js";

async function test() {
  try {
    console.log("Connecting to DB...");
    const res = await pool.query("SELECT NOW()");
    console.log("Success! DB time:", res.rows[0].now);
  } catch (err) {
    console.error("DB Connection failed:", err);
  } finally {
    await pool.end();
  }
}

test();
