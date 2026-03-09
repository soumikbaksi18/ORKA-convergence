import { NextRequest, NextResponse } from "next/server";

/** Integration: Kalshi — proxies to Kalshi integration server (which calls Kalshi API). */
const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${KALSHI_API_URL}/api/markets${query ? `?${query}` : ""}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Markets API error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Markets proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch markets",
      },
      { status: 502 }
    );
  }
}
