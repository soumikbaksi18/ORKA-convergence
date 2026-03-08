import { NextRequest, NextResponse } from "next/server";

const KALSHI_API_URL =
  process.env.KALSHI_API_URL || "http://localhost:4000";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const { order_id } = await params;
  const url = `${KALSHI_API_URL}/api/orders/${encodeURIComponent(order_id)}`;

  try {
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.error || "Cancel order failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Cancel order proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to cancel order" },
      { status: 502 }
    );
  }
}
