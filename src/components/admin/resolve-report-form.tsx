"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResolveReportForm({ reportId }: { reportId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
      >
        Review
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not resolve report");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve report");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <textarea
        required
        placeholder="Resolution notes..."
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        className="w-full rounded bg-gray-600 p-2 text-sm text-white placeholder:text-gray-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Mark resolved"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
