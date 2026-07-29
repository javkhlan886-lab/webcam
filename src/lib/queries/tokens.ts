import "server-only";
import { pool, query } from "@/lib/db";

export async function getBalance(userId: number): Promise<number> {
  const result = await query(
    `SELECT balance FROM user_tokens WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]?.balance ?? 0;
}

export async function purchaseTokens(
  userId: number,
  amount: number,
  packageType: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO user_tokens (user_id, balance, total_purchased)
       VALUES ($1, $2, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET balance = user_tokens.balance + EXCLUDED.balance,
           total_purchased = user_tokens.total_purchased + EXCLUDED.balance,
           updated_at = CURRENT_TIMESTAMP
       RETURNING balance`,
      [userId, amount],
    );

    await client.query(
      `INSERT INTO token_transactions (from_user_id, amount, type, description)
       VALUES ($1, $2, 'purchase', $3)`,
      [userId, amount, `Purchased ${packageType} package`],
    );

    await client.query("COMMIT");
    return result.rows[0].balance as number;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export class InsufficientTokensError extends Error {}

export async function tipCreator(
  fromUserId: number,
  toCreatorId: number,
  amount: number,
  message: string,
) {
  if (amount <= 0) throw new RangeError("Tip amount must be positive");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const deducted = await client.query(
      `UPDATE user_tokens
       SET balance = balance - $1, total_spent = total_spent + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND balance >= $1
       RETURNING balance`,
      [amount, fromUserId],
    );

    if (deducted.rowCount === 0) {
      throw new InsufficientTokensError("Insufficient tokens");
    }

    await client.query(
      `INSERT INTO user_tokens (user_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET balance = user_tokens.balance + EXCLUDED.balance, updated_at = CURRENT_TIMESTAMP`,
      [toCreatorId, amount],
    );

    await client.query(
      `INSERT INTO token_transactions (from_user_id, to_user_id, amount, type, description)
       VALUES ($1, $2, $3, 'tip', $4)`,
      [fromUserId, toCreatorId, amount, message || "Anonymous tip"],
    );

    await client.query(
      `INSERT INTO notifications (user_id, from_user_id, type, content)
       VALUES ($1, $2, 'tip', $3)`,
      [toCreatorId, fromUserId, `Received ${amount} tokens tip`],
    );

    await client.query(
      `UPDATE creator_profiles SET total_earnings = total_earnings + $1 WHERE user_id = $2`,
      [amount, toCreatorId],
    );

    await client.query("COMMIT");
    return deducted.rows[0].balance as number;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
