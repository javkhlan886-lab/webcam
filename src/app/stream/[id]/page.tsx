import { notFound } from "next/navigation";
import { BroadcastPanel } from "@/components/stream/broadcast-panel";
import { LivePlayer } from "@/components/stream/live-player";
import { StreamSidebar } from "@/components/stream/stream-sidebar";
import { getStreamById } from "@/lib/queries/streams";
import { getBalance } from "@/lib/queries/tokens";
import { getSession } from "@/lib/session";

export default async function StreamViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const streamId = Number(id);
  if (!Number.isInteger(streamId)) notFound();

  const [stream, session] = await Promise.all([
    getStreamById(streamId),
    getSession(),
  ]);
  if (!stream) notFound();

  const balance = session ? await getBalance(session.id) : 0;
  const isOwner = session?.id === stream.creatorId;

  return (
    <div className="min-h-screen flex-1 bg-gray-900 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isOwner ? (
            <BroadcastPanel streamId={stream.id} />
          ) : stream.isActive ? (
            <div className="mb-6">
              <LivePlayer streamId={stream.id} creatorId={stream.creatorId} />
            </div>
          ) : (
            <div className="mb-6 flex aspect-video items-center justify-center rounded-lg bg-black">
              <span className="text-gray-400">Stream is offline</span>
            </div>
          )}

          <div className="mb-6 rounded-lg bg-gray-800 p-6">
            <h1 className="mb-2 text-2xl font-bold text-white">
              {stream.title}
            </h1>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-600" />
                <div>
                  <p className="font-bold text-white">{stream.username}</p>
                  <p className="text-gray-400">
                    {stream.followersCount} followers
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded bg-pink-600 px-6 py-2 text-white hover:bg-pink-700"
              >
                Follow
              </button>
            </div>

            {stream.description && (
              <p className="mb-4 text-gray-300">{stream.description}</p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded bg-gray-700 p-3 text-center">
                <p className="text-gray-400">Rating</p>
                <p className="font-bold text-yellow-500">
                  {stream.rating.toFixed(1)}
                </p>
              </div>
              <div className="rounded bg-gray-700 p-3 text-center">
                <p className="text-gray-400">Viewers</p>
                <p className="font-bold text-white">{stream.viewersCount}</p>
              </div>
              <div className="rounded bg-gray-700 p-3 text-center">
                <p className="text-gray-400">Earnings</p>
                <p className="font-bold text-pink-500">
                  {stream.totalEarnings}
                </p>
              </div>
            </div>
          </div>
        </div>

        <StreamSidebar
          creatorId={stream.creatorId}
          isLoggedIn={Boolean(session)}
          currentUsername={session?.username ?? null}
          initialBalance={balance}
        />
      </div>
    </div>
  );
}
