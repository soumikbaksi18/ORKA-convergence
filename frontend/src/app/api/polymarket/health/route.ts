import { NextResponse } from "next/server";

/** Integration: Polymarket — health check via Gamma API (via proxy). */
const POLYMARKET_GAMMA_URL = "https://gamma-api.polymarket.com";
const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

export async function GET() {
  const start = Date.now();
  const targetUrl = `${POLYMARKET_GAMMA_URL}/events?limit=1`;

  try {
    const res = await fetch(PROXY_URL, {
      method: "GET",
      headers: {
        "X-Target-URL": targetUrl,
        Accept: "application/json",
        ...(process.env.PROXY_SECRET && {
          "X-Proxy-Secret": process.env.PROXY_SECRET,
        }),
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - start;
    const ok = res.ok;
    return NextResponse.json({
      ok,
      latencyMs: ok ? latencyMs : undefined,
      status: ok ? "ok" : "error",
      service: "polymarket-gamma",
    });
  } catch {
    return NextResponse.json({ ok: false, status: "error" }, { status: 502 });
  }
}
