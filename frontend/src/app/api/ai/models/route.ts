import { NextResponse } from "next/server";

const AI_API_URL = process.env.AI_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${AI_API_URL}/api/models`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || "AI models error" },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("AI models proxy error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to fetch models" },
      { status: 502 }
    );
  }
}
