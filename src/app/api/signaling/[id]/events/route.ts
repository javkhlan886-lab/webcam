import { getStreamById } from "@/lib/queries/streams";
import { getSession } from "@/lib/session";
import {
  heartbeat,
  listOthers,
  send,
  subscribe,
  unsubscribe,
} from "@/lib/webrtc/signaling-hub";

const HEARTBEAT_MS = 25000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const streamId = Number(id);
  if (!Number.isInteger(streamId))
    return new Response("Invalid stream id", { status: 400 });

  const stream = await getStreamById(streamId);
  if (!stream) return new Response("Stream not found", { status: 404 });

  const isCreator = session.id === stream.creatorId;
  const encoder = new TextEncoder();

  let interval: ReturnType<typeof setInterval> | undefined;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      subscribe(streamId, session.id, session.username, controller);

      if (isCreator) {
        for (const viewer of listOthers(streamId, session.id)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "viewer-joined", from: viewer.userId, username: viewer.username })}\n\n`,
            ),
          );
        }
      } else {
        send(streamId, stream.creatorId, {
          type: "viewer-joined",
          from: session.id,
          username: session.username,
        });
      }

      interval = setInterval(
        () => heartbeat(streamId, session.id),
        HEARTBEAT_MS,
      );

      const cleanup = () => {
        clearInterval(interval);
        unsubscribe(streamId, session.id);
        if (!isCreator) {
          send(streamId, stream.creatorId, {
            type: "viewer-left",
            from: session.id,
          });
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      clearInterval(interval);
      unsubscribe(streamId, session.id);
      if (!isCreator) {
        send(streamId, stream.creatorId, {
          type: "viewer-left",
          from: session.id,
        });
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
