import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createUser } from "@/lib/queries/users";
import { createSession } from "@/lib/session";

const VALID_ROLES = new Set(["user", "creator"]);

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, username, displayName, role } = body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string"
  ) {
    return NextResponse.json(
      { error: "Email, password, and username are required" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  const finalRole = VALID_ROLES.has(role) ? role : "user";

  try {
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      username,
      displayName:
        typeof displayName === "string" && displayName ? displayName : username,
      role: finalRole,
    });

    await createSession({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
