import { NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET() {
  const start = Date.now();
  try {
    const res = await fetch(`${KALSHI_API_URL}/health`, {
      cache: "no-store",
    });
    const latencyMs = Date.now() - start;
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      latencyMs: res.ok ? latencyMs : undefined,
      ...data,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
