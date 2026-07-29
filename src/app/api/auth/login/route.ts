import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/queries/users";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return NextResponse.json({ user: publicUser });
}
