import { NextResponse } from "next/server";
import { banUser } from "@/lib/queries/admin";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin")
    return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await params;
  const targetUserId = Number(id);
  if (!Number.isInteger(targetUserId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const reason =
    typeof body?.reason === "string" && body.reason
      ? body.reason
      : "Violating terms of service";
  const durationDays = Number.isInteger(body?.durationDays)
    ? body.durationDays
    : 30;

  await banUser(session.id, targetUserId, reason, durationDays);
  return NextResponse.json({ success: true });
}
