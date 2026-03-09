import { NextRequest, NextResponse } from "next/server";

const POLYMARKET_GAMMA_URL = "https://gamma-api.polymarket.com";
const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  if (!eventId) {
    return NextResponse.json(
      { success: false, error: "Missing event ID" },
      { status: 400 }
    );
  }

  const targetUrl = `${POLYMARKET_GAMMA_URL}/events/${encodeURIComponent(eventId)}`;

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
        { success: false, error: data?.message || "Polymarket event not found" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Polymarket event proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch Polymarket event",
      },
      { status: 502 }
    );
  }
}
