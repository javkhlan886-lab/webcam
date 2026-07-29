import Link from "next/link";
import { listPublicStreams } from "@/lib/queries/streams";

export default async function HomePage() {
  const streams = await listPublicStreams();

  return (
    <div className="min-h-screen flex-1 bg-gray-900 p-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-white">Live Streams</h1>
        <p className="text-gray-400">
          Join creators and support them with tips
        </p>
      </div>

      {streams.length === 0 ? (
        <p className="text-gray-400">No streams yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="overflow-hidden rounded-lg bg-gray-800 transition hover:shadow-xl"
            >
              <div className="relative flex h-48 items-center justify-center bg-black">
                {stream.isActive && (
                  <div className="absolute top-3 left-3 rounded bg-red-600 px-3 py-1 font-bold text-white">
                    LIVE
                  </div>
                )}
                <span className="text-gray-400">Stream Thumbnail</span>
              </div>
              <div className="p-4">
                <h3 className="mb-2 font-bold text-white">{stream.title}</h3>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-600" />
                  <span className="text-gray-300">{stream.username}</span>
                </div>
                <div className="mb-3 text-sm text-gray-400">
                  {stream.viewersCount} viewers
                </div>
                <Link
                  href={`/stream/${stream.id}`}
                  className="block w-full rounded bg-pink-600 p-2 text-center text-white hover:bg-pink-700"
                >
                  Watch
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
