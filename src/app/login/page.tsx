"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Invalid credentials");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="w-96 rounded-lg bg-gray-800 p-8 shadow-2xl">
        <h1 className="mb-6 text-3xl font-bold text-white">Javkhlan's system Login</h1>
        {error && (
          <div className="mb-4 rounded bg-red-500 p-3 text-white">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-pink-600 p-3 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {pending ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-pink-500">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
