import Link from "next/link";
import { StartStreamForm } from "@/components/dashboard/start-stream-form";
import { getCreatorStats } from "@/lib/queries/creators";
import { getActiveStreamIdForCreator } from "@/lib/queries/streams";
import { requireRole } from "@/lib/session";

export default async function CreatorDashboard() {
  const session = await requireRole("creator");
  const [stats, activeStreamId] = await Promise.all([
    getCreatorStats(session.id),
    getActiveStreamIdForCreator(session.id),
  ]);

  return (
    <div className="min-h-screen flex-1 bg-gray-900 p-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Creator Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white">
          <p className="mb-2 text-gray-200">Followers</p>
          <p className="text-3xl font-bold">{stats.followersCount}</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-green-600 to-green-800 p-6 text-white">
          <p className="mb-2 text-gray-200">Total Earnings (tokens)</p>
          <p className="text-3xl font-bold">{stats.totalEarnings}</p>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-pink-600 to-pink-800 p-6 text-white">
          <p className="mb-2 text-gray-200">Total Tips (tokens)</p>
          <p className="text-3xl font-bold">{stats.totalTips}</p>
        </div>
      </div>

      <div className="rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">
          {stats.isLive ? "You're live" : "Go Live"}
        </h2>
        {stats.isLive ? (
          <div>
            <p className="mb-3 text-gray-400">
              You already have an active stream.
            </p>
            {activeStreamId && (
              <Link
                href={`/stream/${activeStreamId}`}
                className="inline-block rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
              >
                Go to your live stream
              </Link>
            )}
          </div>
        ) : (
          <StartStreamForm />
        )}
      </div>
    </div>
  );
}
