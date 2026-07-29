import "server-only";
import { query } from "@/lib/db";

export type CreatorStats = {
  followersCount: number;
  totalEarnings: number;
  totalTips: number;
  isLive: boolean;
};

export async function getCreatorStats(
  creatorId: number,
): Promise<CreatorStats> {
  const [profile, tips] = await Promise.all([
    query(
      `SELECT u.followers_count, COALESCE(cp.total_earnings, 0) AS total_earnings, COALESCE(cp.is_live, false) AS is_live
       FROM users u
       LEFT JOIN creator_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [creatorId],
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total_tips
       FROM token_transactions
       WHERE to_user_id = $1 AND type = 'tip'`,
      [creatorId],
    ),
  ]);

  const profileRow = profile.rows[0];

  return {
    followersCount: profileRow?.followers_count ?? 0,
    totalEarnings: Number(profileRow?.total_earnings ?? 0),
    totalTips: Number(tips.rows[0]?.total_tips ?? 0),
    isLive: profileRow?.is_live ?? false,
  };
}
