import { NextRequest, NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const depth = request.nextUrl.searchParams.get("depth") || "15";
  const url = `${KALSHI_API_URL}/api/markets/${encodeURIComponent(ticker)}/orderbook?depth=${depth}`;

  try {
    const res = await fetch(url, { next: { revalidate: 10 } });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Orderbook not found" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Orderbook proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch orderbook" },
      { status: 502 }
    );
  }
}
