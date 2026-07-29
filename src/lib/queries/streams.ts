import "server-only";
import crypto from "node:crypto";
import { query } from "@/lib/db";

export type StreamSummary = {
  id: number;
  creatorId: number;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  viewersCount: number;
  isActive: boolean;
  username: string;
  avatarUrl: string | null;
};

export type StreamDetail = StreamSummary & {
  followersCount: number;
  rating: number;
  totalEarnings: number;
};

function toSummary(row: Record<string, unknown>): StreamSummary {
  return {
    id: row.id as number,
    creatorId: row.creator_id as number,
    title: row.title as string,
    description: (row.description as string) ?? null,
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    viewersCount: row.viewers_count as number,
    isActive: row.is_active as boolean,
    username: row.username as string,
    avatarUrl: (row.avatar_url as string) ?? null,
  };
}

export async function listPublicStreams(): Promise<StreamSummary[]> {
  const result = await query(
    `SELECT s.id, s.creator_id, s.title, s.description, s.thumbnail_url,
            s.viewers_count, s.is_active, u.username, u.avatar_url
     FROM live_streams s
     JOIN users u ON s.creator_id = u.id
     WHERE s.is_public = true
     ORDER BY s.is_active DESC, s.viewers_count DESC`,
  );
  return result.rows.map(toSummary);
}

export async function getStreamById(id: number): Promise<StreamDetail | null> {
  const result = await query(
    `SELECT s.id, s.creator_id, s.title, s.description, s.thumbnail_url,
            s.viewers_count, s.is_active, u.username, u.avatar_url, u.followers_count,
            COALESCE(cp.rating, 0) AS rating, COALESCE(cp.total_earnings, 0) AS total_earnings
     FROM live_streams s
     JOIN users u ON s.creator_id = u.id
     LEFT JOIN creator_profiles cp ON u.id = cp.user_id
     WHERE s.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    ...toSummary(row),
    followersCount: row.followers_count as number,
    rating: Number(row.rating),
    totalEarnings: Number(row.total_earnings),
  };
}

export async function startStream(
  creatorId: number,
  title: string,
  description: string,
) {
  const streamKey = `stream_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const result = await query(
    `INSERT INTO live_streams (creator_id, title, description, stream_key, is_active, is_public, started_at)
     VALUES ($1, $2, $3, $4, true, true, CURRENT_TIMESTAMP)
     RETURNING id`,
    [creatorId, title, description, streamKey],
  );
  await query(`UPDATE creator_profiles SET is_live = true WHERE user_id = $1`, [
    creatorId,
  ]);
  return result.rows[0].id as number;
}

export async function getActiveStreamIdForCreator(
  creatorId: number,
): Promise<number | null> {
  const result = await query(
    `SELECT id FROM live_streams WHERE creator_id = $1 AND is_active = true ORDER BY id DESC LIMIT 1`,
    [creatorId],
  );
  return result.rows[0]?.id ?? null;
}

export async function endStream(streamId: number, creatorId: number) {
  await query(
    `UPDATE live_streams SET is_active = false, ended_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND creator_id = $2`,
    [streamId, creatorId],
  );
  await query(
    `UPDATE creator_profiles SET is_live = false WHERE user_id = $1`,
    [creatorId],
  );
}
