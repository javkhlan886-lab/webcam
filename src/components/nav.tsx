"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";

export function Nav({ user }: { user: SessionPayload | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="flex items-center justify-between bg-gray-900 p-4 text-white">
      <Link href="/" className="text-2xl font-bold">
        StreamHub
      </Link>
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link href="/" className="hover:text-pink-500">
              Home
            </Link>
            {user.role === "creator" && (
              <Link href="/dashboard" className="hover:text-pink-500">
                Dashboard
              </Link>
            )}
            {user.role === "admin" && (
              <Link href="/admin" className="hover:text-pink-500">
                Admin Panel
              </Link>
            )}
            <span className="text-gray-400">@{user.username}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-pink-600 px-4 py-2 hover:bg-pink-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-pink-500">
              Login
            </Link>
            <Link href="/register" className="hover:text-pink-500">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
