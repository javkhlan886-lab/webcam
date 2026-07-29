import "server-only";
import type { Role } from "@/lib/auth";
import { query } from "@/lib/db";

export type PublicUser = {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: Role;
  followersCount: number;
  followingCount: number;
};

export type UserWithPassword = PublicUser & { passwordHash: string };

export async function findUserByEmail(
  email: string,
): Promise<UserWithPassword | null> {
  const result = await query(
    `SELECT id, email, username, display_name, bio, avatar_url, role,
            followers_count, following_count, password_hash
     FROM users WHERE email = $1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    role: row.role,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    passwordHash: row.password_hash,
  };
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const result = await query(
    `SELECT id, email, username, display_name, bio, avatar_url, role,
            followers_count, following_count
     FROM users WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    role: row.role,
    followersCount: row.followers_count,
    followingCount: row.following_count,
  };
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  username: string;
  displayName: string;
  role: Role;
}) {
  const result = await query(
    `INSERT INTO users (email, password_hash, username, display_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, username, display_name, bio, avatar_url, role, followers_count, following_count`,
    [
      input.email,
      input.passwordHash,
      input.username,
      input.displayName,
      input.role,
    ],
  );
  const row = result.rows[0];

  const user: PublicUser = {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    role: row.role,
    followersCount: row.followers_count,
    followingCount: row.following_count,
  };

  if (input.role === "creator") {
    await query(`INSERT INTO creator_profiles (user_id) VALUES ($1)`, [
      user.id,
    ]);
  }
  await query(`INSERT INTO user_tokens (user_id, balance) VALUES ($1, 0)`, [
    user.id,
  ]);

  return user;
}
