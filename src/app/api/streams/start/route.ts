import { NextResponse } from "next/server";
import { startStream } from "@/lib/queries/streams";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "creator")
    return NextResponse.json({ error: "Creators only" }, { status: 403 });

  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const streamId = await startStream(session.id, title, description);
  return NextResponse.json({ streamId }, { status: 201 });
}
