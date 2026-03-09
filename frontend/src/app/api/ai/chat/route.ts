import { NextRequest, NextResponse } from "next/server";

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${AI_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || data.message || "AI chat error" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("AI chat proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to send message" },
      { status: 502 }
    );
  }
}
