"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserBanToggle({
  userId,
  isActive,
}: {
  userId: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleClick = async () => {
    setPending(true);
    try {
      const endpoint = isActive ? "ban" : "unban";
      await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  if (isActive) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "..." : "Ban"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
    >
      {pending ? "..." : "Unban"}
    </button>
  );
}
