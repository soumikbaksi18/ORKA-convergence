import { NextRequest, NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const url = `${KALSHI_API_URL}/api/markets/${encodeURIComponent(ticker)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 30 } });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Market not found" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Market proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch market",
      },
      { status: 502 }
    );
  }
}
