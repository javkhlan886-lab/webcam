import { NextResponse } from "next/server";

// Deliberately does not touch the database — platform health checks (Railway,
// Render, etc.) should succeed as soon as the process is up, independent of
// whether migrations have run yet.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
