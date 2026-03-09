import { NextRequest, NextResponse } from "next/server";

const CLOB_URL = "https://clob.polymarket.com";
const PROXY_URL =
  process.env.PROXY_URL || "https://convergence-proxy.dipansrimany.workers.dev/proxy";

/** Proxy to Polymarket CLOB GET /prices-history for chart data. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market");
  if (!market) {
    return NextResponse.json(
      { success: false, error: "Missing market (token id) parameter" },
      { status: 400 }
    );
  }

  const interval = searchParams.get("interval") ?? "1d";
  const startTs = searchParams.get("startTs");
  const endTs = searchParams.get("endTs");
  const fidelity = searchParams.get("fidelity");

  const params = new URLSearchParams();
  params.set("market", market);
  params.set("interval", interval);
  if (startTs != null) params.set("startTs", startTs);
  if (endTs != null) params.set("endTs", endTs);
  if (fidelity != null) params.set("fidelity", fidelity);

  const targetUrl = `${CLOB_URL}/prices-history?${params.toString()}`;

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
      next: { revalidate: 60 },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.message || data?.error || "Polymarket CLOB error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Polymarket prices-history proxy error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error ? err.message : "Failed to fetch price history",
      },
      { status: 502 }
    );
  }
}
