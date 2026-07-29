import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type Role = "admin" | "creator" | "user";

export type SessionPayload = {
  id: number;
  email: string;
  username: string;
  role: Role;
};

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.warn(
    "JWT_SECRET is not set. Sessions will use an insecure development-only secret; set JWT_SECRET before deploying.",
  );
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

const effectiveSecret = secret || "dev_only_insecure_secret";

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, effectiveSecret, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, effectiveSecret) as SessionPayload;
  } catch {
    return null;
  }
}
