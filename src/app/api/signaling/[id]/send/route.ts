import { NextResponse } from "next/server";
import { getStreamById } from "@/lib/queries/streams";
import { getSession } from "@/lib/session";
import { send } from "@/lib/webrtc/signaling-hub";
import type { SignalMessage } from "@/lib/webrtc/types";

const ALLOWED_TYPES = new Set(["offer", "answer", "ice-candidate"]);

export async function POST(
  request: Request,
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

  const stream = await getStreamById(streamId);
  if (!stream)
    return NextResponse.json({ error: "Stream not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const to = Number(body?.to);
  const type = body?.type;

  if (!Number.isInteger(to) || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid signal" }, { status: 400 });
  }

  const isCreator = session.id === stream.creatorId;
  // Viewers may only signal the broadcaster; the broadcaster may signal any viewer.
  if (!isCreator && to !== stream.creatorId) {
    return NextResponse.json(
      { error: "Viewers can only signal the broadcaster" },
      { status: 403 },
    );
  }

  let message: SignalMessage;
  if (type === "offer" || type === "answer") {
    if (!body?.sdp)
      return NextResponse.json({ error: "Missing sdp" }, { status: 400 });
    message = { type, from: session.id, sdp: body.sdp };
  } else {
    if (!body?.candidate)
      return NextResponse.json({ error: "Missing candidate" }, { status: 400 });
    message = {
      type: "ice-candidate",
      from: session.id,
      candidate: body.candidate,
    };
  }

  const delivered = send(streamId, to, message);
  return NextResponse.json({ delivered });
}
