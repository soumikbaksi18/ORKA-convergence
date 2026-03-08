import { NextRequest, NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${KALSHI_API_URL}/api/orders${query ? `?${query}` : ""}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Orders API error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Orders proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch orders" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const url = `${KALSHI_API_URL}/api/orders`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Create order failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Create order proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create order" },
      { status: 502 }
    );
  }
}
