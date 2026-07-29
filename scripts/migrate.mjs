import { readFileSync } from "node:fs";
import pg from "pg";
import { getPoolConfig } from "./db-config.mjs";

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

const pool = new pg.Pool(getPoolConfig());

try {
  await pool.query(schema);
  console.log("Migration complete.");
} finally {
  await pool.end();
}
