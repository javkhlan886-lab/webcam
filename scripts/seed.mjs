import bcrypt from "bcryptjs";
import pg from "pg";
import { getPoolConfig } from "./db-config.mjs";

const pool = new pg.Pool(getPoolConfig());

const DEMO_PASSWORD = "password123";

async function upsertUser(client, { email, username, displayName, role }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const result = await client.query(
    `INSERT INTO users (email, password_hash, username, display_name, role, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING id`,
    [email, passwordHash, username, displayName, role]
  );
  return result.rows[0].id;
}

const client = await pool.connect();

try {
  await client.query("BEGIN");

  const adminId = await upsertUser(client, {
    email: "admin@streamhub.dev",
    username: "admin",
    displayName: "Admin",
    role: "admin",
  });

  const creatorId = await upsertUser(client, {
    email: "creator@streamhub.dev",
    username: "demo_creator",
    displayName: "Demo Creator",
    role: "creator",
  });

  const viewerId = await upsertUser(client, {
    email: "viewer@streamhub.dev",
    username: "demo_viewer",
    displayName: "Demo Viewer",
    role: "user",
  });

  await client.query(
    `INSERT INTO creator_profiles (user_id, bio, is_live, rating, subscription_price, private_show_rate)
     VALUES ($1, 'Just streaming for fun.', true, 4.8, 50, 10)
     ON CONFLICT (user_id) DO NOTHING`,
    [creatorId]
  );

  await client.query(
    `INSERT INTO live_streams (creator_id, title, description, stream_key, is_active, is_public, viewers_count, started_at)
     VALUES ($1, 'Chatting and chilling', 'Come say hi!', $2, true, true, 12, CURRENT_TIMESTAMP)
     ON CONFLICT (stream_key) DO NOTHING`,
    [creatorId, `seed_stream_${creatorId}`]
  );

  await client.query(
    `INSERT INTO user_tokens (user_id, balance)
     VALUES ($1, 500), ($2, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [viewerId, creatorId]
  );

  const existingReport = await client.query(
    `SELECT id FROM reports WHERE reporter_id = $1 AND reported_user_id = $2`,
    [viewerId, creatorId]
  );
  if (existingReport.rows.length === 0) {
    await client.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason, description, status)
       VALUES ($1, $2, 'Inappropriate chat behavior', 'Used offensive language in the live chat.', 'pending')`,
      [viewerId, creatorId]
    );
  }

  await client.query("COMMIT");

  console.log("Seed complete. Demo accounts (password: %s):", DEMO_PASSWORD);
  console.log("  admin@streamhub.dev (admin)");
  console.log("  creator@streamhub.dev (creator)");
  console.log("  viewer@streamhub.dev (user, 500 tokens)");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
