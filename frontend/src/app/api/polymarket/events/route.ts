import { NextRequest, NextResponse } from "next/server";


const POLYMARKET_GAMMA_URL = "https://gamma-api.polymarket.com";

const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "50";
  const offset = searchParams.get("offset") ?? "0";
  const active = searchParams.get("active");
  const closed = searchParams.get("closed");

  const params = new URLSearchParams();
  params.set("limit", limit);
  params.set("offset", offset);
  if (active != null) params.set("active", active);
  if (closed != null) params.set("closed", closed);

  const targetUrl = `${POLYMARKET_GAMMA_URL}/events?${params.toString()}`;

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
      next: { revalidate: 30 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.message || "Polymarket API error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Polymarket events proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch Polymarket events",
      },
      { status: 502 }
    );
  }
}
