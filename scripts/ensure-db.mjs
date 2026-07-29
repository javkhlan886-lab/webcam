import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) config({ path: file });
}

// A remote/hosted DB is configured — nothing local to manage.
if (process.env.DATABASE_URL) {
  process.exit(0);
}

const pgCtl = process.env.PG_CTL_PATH;
const pgData = process.env.PG_DATA_DIR;

// No local Postgres was set up on this machine (e.g. a real system service
// is used instead, or DB_HOST points elsewhere) — nothing to do.
if (!pgCtl || !pgData || !existsSync(pgCtl) || !existsSync(pgData)) {
  process.exit(0);
}

const status = spawnSync(pgCtl, ["-D", pgData, "status"]);
if (status.status === 0) {
  console.log("Postgres already running.");
  process.exit(0);
}

console.log("Starting local Postgres...");
const start = spawnSync(
  pgCtl,
  ["-D", pgData, "-l", `${pgData}/logfile.txt`, "-o", "-p 5432", "start"],
  { stdio: "inherit" }
);

if (start.status !== 0) {
  console.error("Could not start Postgres automatically. Start it manually and retry.");
  process.exit(start.status ?? 1);
}
