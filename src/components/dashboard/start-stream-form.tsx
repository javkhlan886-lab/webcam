"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartStreamForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/streams/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start stream");
      router.push(`/stream/${data.streamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start stream");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <input
        type="text"
        placeholder="Stream Title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
      />
      <textarea
        placeholder="Stream Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-red-600 p-3 font-bold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "Starting..." : "Start Streaming"}
      </button>
    </form>
  );
}
