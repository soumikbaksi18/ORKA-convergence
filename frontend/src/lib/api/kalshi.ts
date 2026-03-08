import type {
  Market,
  MarketsApiResponse,
  MarketApiResponse,
  EventApiResponse,
} from "@/types/markets";

/** Use same-origin API routes so markets load reliably (no CORS). */
const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : "";

// ── Helpers: real API returns dollar strings + cent integers ──

/** Parse dollar string "0.6500" -> cents integer 65. Falls back to 0. */
export function dollarsToCents(dollars: string | undefined | null): number {
  if (!dollars) return 0;
  return Math.round(parseFloat(dollars) * 100);
}

/** Parse fixed-point string "1234.00" -> number 1234. Falls back to 0. */
export function parseFp(fp: string | undefined | null): number {
  if (!fp) return 0;
  return parseFloat(fp) || 0;
}

/** Get the best available cent price (prefers the integer field, falls back to dollar string). */
export function getYesBid(m: Market): number {
  return m.yes_bid ?? dollarsToCents(m.yes_bid_dollars);
}
export function getYesAsk(m: Market): number {
  return m.yes_ask ?? dollarsToCents(m.yes_ask_dollars);
}
export function getNoBid(m: Market): number {
  return m.no_bid ?? dollarsToCents(m.no_bid_dollars);
}
export function getNoAsk(m: Market): number {
  return m.no_ask ?? dollarsToCents(m.no_ask_dollars);
}
export function getLastPrice(m: Market): number {
  return m.last_price ?? dollarsToCents(m.last_price_dollars);
}
export function getVolume(m: Market): number {
  return m.volume ?? parseFp(m.volume_fp);
}
export function getVolume24h(m: Market): number {
  return m.volume_24h ?? parseFp(m.volume_24h_fp);
}
export function getOpenInterest(m: Market): number {
  return m.open_interest ?? parseFp(m.open_interest_fp);
}

/** Get market display title. Real API has `title` on regular markets. */
export function getMarketTitle(m: Market): string {
  // Regular markets have a clean title like "Will X happen?"
  if (m.title && m.title.length > 0) return m.title;
  // For sibling markets in an event, yes_sub_title is the option name (e.g., "Maryland-Eastern Shore")
  if (m.yes_sub_title && m.yes_sub_title.length < 80) return m.yes_sub_title;
  // Fallback to ticker
  return m.ticker;
}

/** Get the option/outcome label for a market (yes_sub_title). */
export function getMarketOptionLabel(m: Market): string {
  return m.yes_sub_title || m.title || m.ticker;
}

/** Get expiration time -- real API uses latest_expiration_time, demo used expiration_time. */
export function getExpiration(m: Market): string {
  return m.latest_expiration_time || m.expiration_time || m.close_time || "";
}

// ── Fetch functions ──

export interface FetchMarketsParams {
  limit?: number;
  cursor?: string;
  status?: "open" | "closed" | "settled" | "unopened" | "paused";
  event_ticker?: string;
  series_ticker?: string;
  tickers?: string;
  mve_filter?: "only" | "exclude";
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
  if (params.tickers) searchParams.set("tickers", params.tickers);
  if (params.mve_filter) searchParams.set("mve_filter", params.mve_filter);

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

export interface OrderbookFp {
  yes_dollars?: [string, string][];
  no_dollars?: [string, string][];
}

export async function fetchOrderbook(
  ticker: string,
  depth = 15
): Promise<{ success: boolean; data: OrderbookLevel; data_fp?: OrderbookFp }> {
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
  yes_price_dollars?: string;
  no_price_dollars?: string;
  count: number;
  count_fp?: string;
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

// ── Order endpoints (authenticated) ──

export interface CreateOrderParams {
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count?: number;
  yes_price?: number;
  no_price?: number;
  time_in_force?: "fill_or_kill" | "good_till_canceled" | "immediate_or_cancel";
}

export async function createOrder(params: CreateOrderParams) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create order");
  }
  return res.json();
}

export async function fetchOrders(params: {
  ticker?: string;
  status?: "resting" | "canceled" | "executed";
  limit?: number;
  cursor?: string;
} = {}) {
  const sp = new URLSearchParams();
  if (params.ticker) sp.set("ticker", params.ticker);
  if (params.status) sp.set("status", params.status);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  const res = await fetch(`${API_BASE}/api/orders?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch orders");
  }
  return res.json();
}

export async function cancelOrder(orderId: string) {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to cancel order");
  }
  return res.json();
}
