import { NextRequest, NextResponse } from "next/server";

const ALLOWED_IMAGE_ORIGINS = [
  "https://kalshi.com",
  "http://kalshi.com",
  "https://api.elections.kalshi.com",
  "https://api.kalshi.com",
  "https://gamma-api.polymarket.com",
  "https://polymarket.com",
  "https://clob.polymarket.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const origin = u.origin;
    return ALLOWED_IMAGE_ORIGINS.some(
      (allowed) => origin === allowed || origin === allowed.replace("https://", "http://")
    );
  } catch {
    return false;
  }
}

/** Proxies image requests to avoid CORS and wrong-host issues (e.g. Kalshi images). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid or disallowed URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
