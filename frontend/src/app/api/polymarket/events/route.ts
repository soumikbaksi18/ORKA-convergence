import { NextRequest, NextResponse } from "next/server";

const POLYMARKET_GAMMA_URL = "https://gamma-api.polymarket.com";
const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

/** Gamma API returns 422 for order/ascending; we fetch without them then sort in-memory. */
const GAMMA_ORDER_KEYS = [
  "volume_24hr",
  "volume",
  "liquidity",
  "start_date",
  "end_date",
  "competitive",
  "closed_time",
] as const;

function sortEvents(
  events: unknown[],
  order: string | null,
  ascending: string | null
): unknown[] {
  if (!order || !GAMMA_ORDER_KEYS.includes(order as (typeof GAMMA_ORDER_KEYS)[number])) {
    return events;
  }
  const dir = ascending === "true" ? 1 : -1;
  const key =
    order === "volume_24hr"
      ? "volume24hr"
      : order === "start_date"
        ? "startDate"
        : order === "end_date"
          ? "endDate"
          : order === "closed_time"
            ? "closedTime"
            : order;
  const numericKeys = ["volume24hr", "volume", "liquidity", "competitive"];
  const def: number | string = numericKeys.includes(key) ? 0 : "";
  return [...events].sort((a: unknown, b: unknown) => {
    const ma = a as Record<string, unknown>;
    const mb = b as Record<string, unknown>;
    const va: number | string = (ma[key] as number | string | undefined) ?? def;
    const vb: number | string = (mb[key] as number | string | undefined) ?? def;
    if (typeof va === "number" && typeof vb === "number") return dir * (va - vb);
    return dir * String(va).localeCompare(String(vb));
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "50";
  const offset = searchParams.get("offset") ?? "0";
  const active = searchParams.get("active");
  const closed = searchParams.get("closed");
  const order = searchParams.get("order");
  const ascending = searchParams.get("ascending");
  const tag_slug = searchParams.get("tag_slug");

  const params = new URLSearchParams();
  params.set("limit", limit);
  params.set("offset", offset);
  if (active != null) params.set("active", active);
  if (closed != null) params.set("closed", closed);
  if (active === "true" && closed == null) params.set("closed", "false");
  if (tag_slug != null && tag_slug !== "") params.set("tag_slug", tag_slug);

  const targetUrl = `${POLYMARKET_GAMMA_URL}/events?${params.toString()}`;

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
        { success: false, error: data?.message || data?.error || "Polymarket API error" },
        { status: res.status }
      );
    }

    const list = Array.isArray(data) ? sortEvents(data, order, ascending) : data;
    return NextResponse.json(list);
  } catch (err) {
    console.error("Polymarket events proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch Polymarket events",
      },
      { status: 502 }
    );
  }
}
