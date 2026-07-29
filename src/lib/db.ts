import "server-only";
import { Pool, type QueryResultRow } from "pg";

function createPool() {
  const pool = process.env.DATABASE_URL
    ? // Managed Postgres providers (Render, Neon, Heroku, ...) require SSL and
      // typically use certs not in Node's default trust store.
      new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new Pool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "streamhub",
      });

  // Without this, an error on an idle pooled client (e.g. the provider
  // closing a connection) becomes an unhandled exception that crashes the
  // whole Node process instead of just failing the next query that needs
  // a client.
  pool.on("error", (err) => {
    console.error("Unexpected error on idle Postgres client", err);
  });

  return pool;
}

// Reused across hot-reloads in dev so we don't leak connections on every edit.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool = globalForDb.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}
