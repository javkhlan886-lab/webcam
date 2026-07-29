import "server-only";
import type { Role } from "@/lib/auth";
import { query } from "@/lib/db";

export type AdminUserRow = {
  id: number;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  followersCount: number;
  createdAt: string;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  const result = await query(
    `SELECT id, email, username, role, is_active, followers_count, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    isActive: row.is_active,
    followersCount: row.followers_count,
    createdAt: row.created_at,
  }));
}

export async function banUser(
  adminId: number,
  targetUserId: number,
  reason: string,
  durationDays: number,
) {
  await query(`UPDATE users SET is_active = false WHERE id = $1`, [
    targetUserId,
  ]);
  await query(
    `INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, duration_days)
     VALUES ($1, 'ban_user', $2, $3, $4)`,
    [adminId, targetUserId, reason, durationDays],
  );
}

export async function unbanUser(
  adminId: number,
  targetUserId: number,
  reason: string,
) {
  await query(`UPDATE users SET is_active = true WHERE id = $1`, [
    targetUserId,
  ]);
  await query(
    `INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason)
     VALUES ($1, 'unban_user', $2, $3)`,
    [adminId, targetUserId, reason],
  );
}

export type AdminReportRow = {
  id: number;
  reporterName: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export async function listReports(status: string): Promise<AdminReportRow[]> {
  const result = await query(
    `SELECT r.id, u.username AS reporter_name, r.reason, r.description, r.status, r.created_at
     FROM reports r
     JOIN users u ON r.reporter_id = u.id
     WHERE r.status = $1
     ORDER BY r.created_at DESC`,
    [status],
  );
  return result.rows.map((row) => ({
    id: row.id,
    reporterName: row.reporter_name,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function resolveReport(
  reportId: number,
  adminId: number,
  resolution: string,
) {
  await query(
    `UPDATE reports
     SET status = 'resolved', resolution = $1, resolved_by_user_id = $2, resolved_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [resolution, adminId, reportId],
  );
}
