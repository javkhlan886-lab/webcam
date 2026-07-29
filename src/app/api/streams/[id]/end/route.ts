import { NextResponse } from "next/server";
import { endStream } from "@/lib/queries/streams";
import { getSession } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const streamId = Number(id);
  if (!Number.isInteger(streamId)) {
    return NextResponse.json({ error: "Invalid stream id" }, { status: 400 });
  }

  await endStream(streamId, session.id);
  return NextResponse.json({ success: true });
}
