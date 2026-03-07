import type {
  MarketsApiResponse,
  MarketApiResponse,
  EventApiResponse,
} from "@/types/markets";

/** Use same-origin API routes so markets load reliably (no CORS). */
const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : "";

export interface FetchMarketsParams {
  limit?: number;
  cursor?: string;
  status?: "open" | "closed" | "settled" | "unopened";
  event_ticker?: string;
  series_ticker?: string;
}

export async function fetchMarkets(
  params: FetchMarketsParams = {}
): Promise<MarketsApiResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.status) searchParams.set("status", params.status);
  if (params.event_ticker)
    searchParams.set("event_ticker", params.event_ticker);
  if (params.series_ticker)
    searchParams.set("series_ticker", params.series_ticker);

  const url = `${API_BASE}/api/markets?${searchParams.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Markets API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchMarket(ticker: string): Promise<MarketApiResponse> {
  const res = await fetch(`${API_BASE}/api/markets/${encodeURIComponent(ticker)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Market not found: ${res.status}`);
  }
  return res.json();
}

export async function fetchEvent(
  eventTicker: string,
  withNestedMarkets = true
): Promise<EventApiResponse> {
  const url = `${API_BASE}/api/events/${encodeURIComponent(eventTicker)}?with_nested_markets=${withNestedMarkets}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Event not found: ${res.status}`);
  }
  return res.json();
}

export interface OrderbookLevel {
  yes: [number, number][]; // [price_cents, count]
  no: [number, number][];
}

export async function fetchOrderbook(
  ticker: string,
  depth = 15
): Promise<{ success: boolean; data: OrderbookLevel }> {
  const res = await fetch(
    `${API_BASE}/api/markets/${encodeURIComponent(ticker)}/orderbook?depth=${depth}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Orderbook not found");
  }
  return res.json();
}

export interface Trade {
  trade_id: string;
  ticker: string;
  yes_price: number;
  no_price: number;
  count: number;
  taker_side: string;
  created_time: string;
}

export async function fetchTrades(params: {
  ticker?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ success: boolean; data: Trade[]; cursor: string | null }> {
  const sp = new URLSearchParams();
  if (params.ticker) sp.set("ticker", params.ticker);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  const res = await fetch(`${API_BASE}/api/trades?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Trades not found");
  }
  return res.json();
}

export async function checkKalshiHealth(): Promise<{ ok: boolean; latencyMs?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && (data.ok === true || data.status === "ok"),
      latencyMs: data.latencyMs,
    };
  } catch {
    return { ok: false };
  }
}
