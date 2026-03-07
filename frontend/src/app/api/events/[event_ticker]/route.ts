import { NextRequest, NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ event_ticker: string }> }
) {
  const { event_ticker } = await params;
  const withMarkets = request.nextUrl.searchParams.get("with_nested_markets") !== "false";
  const url = `${KALSHI_API_URL}/api/events/${encodeURIComponent(event_ticker)}?with_nested_markets=${withMarkets}`;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Event not found" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Event proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch event",
      },
      { status: 502 }
    );
  }
}
