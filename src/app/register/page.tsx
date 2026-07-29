"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="w-96 rounded-lg bg-gray-800 p-8 shadow-2xl">
        <h1 className="mb-6 text-3xl font-bold text-white">Register</h1>
        {error && (
          <div className="mb-4 rounded bg-red-500 p-3 text-white">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <input
            type="text"
            name="displayName"
            placeholder="Display Name"
            value={formData.displayName}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 p-3 text-white placeholder:text-gray-400"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 p-3 text-white"
          >
            <option value="user">User</option>
            <option value="creator">Content Creator</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-pink-600 p-3 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
