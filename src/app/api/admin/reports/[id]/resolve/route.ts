import { NextResponse } from "next/server";
import { resolveReport } from "@/lib/queries/admin";
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
  const reportId = Number(id);
  if (!Number.isInteger(reportId)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const resolution =
    typeof body?.resolution === "string" ? body.resolution.trim() : "";
  if (!resolution) {
    return NextResponse.json(
      { error: "Resolution notes are required" },
      { status: 400 },
    );
  }

  await resolveReport(reportId, session.id, resolution);
  return NextResponse.json({ success: true });
}
