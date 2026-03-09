import type { Market } from "@/types/markets";

/** Polymarket integration: all functions call Next.js /api/polymarket/* routes, which fetch from Gamma API (gamma-api.polymarket.com) via proxy. */
const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : "";

/** Minimal Polymarket API types (gamma-api response) */
export interface PolymarketMarketRaw {
  id: string;
  conditionId: string;
  question: string;
  outcomePrices?: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  volumeNum?: number;
  volume24hr?: number;
  liquidityNum?: number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  slug?: string;
  image?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface PolymarketEventRaw {
  id: string;
  slug: string;
  title: string;
  image?: string;
  icon?: string;
  markets?: PolymarketMarketRaw[];
  [key: string]: unknown;
}

/** Parse outcomePrices string "[\"0.95\", \"0.05\"]" -> [95, 5] (cents). */
function parseOutcomePrices(outcomePrices: string | undefined): [number, number] {
  if (!outcomePrices) return [0, 0];
  try {
    const arr = JSON.parse(outcomePrices) as string[];
    const yes = Math.round((parseFloat(arr[0] ?? "0") || 0) * 100);
    const no = Math.round((parseFloat(arr[1] ?? "0") || 0) * 100);
    return [yes, no];
  } catch {
    return [0, 0];
  }
}

/** Normalize a Polymarket market to the shared Market shape for the table. */
export function polymarketMarketToMarket(
  pm: PolymarketMarketRaw,
  eventTicker?: string,
  eventImageUrl?: string
): Market {
  const [yesPrice, noPrice] = parseOutcomePrices(pm.outcomePrices);
  const lastPrice = pm.lastTradePrice != null
    ? Math.round((pm.lastTradePrice as number) * 100)
    : yesPrice;
  const bestBid = (pm.bestBid ?? 0) * 100;
  const bestAsk = (pm.bestAsk ?? 1) * 100;

  const imageUrl = pm.image || pm.icon || eventImageUrl || undefined;

  return {
    ticker: `poly-${pm.id}`,
    event_ticker: eventTicker ?? `poly-event-${pm.conditionId}`,
    market_type: "binary",
    title: pm.question ?? "",
    status: pm.closed ? "closed" : pm.active ? "open" : "unknown",
    latest_expiration_time: pm.endDate ?? undefined,
    yes_bid: bestBid > 0 ? Math.round(bestBid) : yesPrice,
    yes_ask: bestAsk < 100 ? Math.round(bestAsk) : (100 - noPrice),
    no_bid: noPrice,
    no_ask: 100 - yesPrice,
    last_price: lastPrice,
    volume: pm.volumeNum ?? 0,
    volume_24h: pm.volume24hr ?? 0,
    open_interest: pm.liquidityNum ?? 0,
    image_url: imageUrl || undefined,
  };
}

/** Flatten events into a single list of normalized markets. */
export function polymarketEventsToMarkets(events: PolymarketEventRaw[]): Market[] {
  const markets: Market[] = [];
  for (const ev of events) {
    const eventTicker = `poly-${ev.id}`;
    const eventImageUrl = ev.image || ev.icon || undefined;
    const list = ev.markets ?? [];
    for (const m of list) {
      if (m.id && (m.question || m.conditionId)) {
        markets.push(polymarketMarketToMarket(m, eventTicker, eventImageUrl));
      }
    }
  }
  return markets;
}

export interface FetchPolymarketEventsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
}

export async function fetchPolymarketEvents(
  params: FetchPolymarketEventsParams = {}
): Promise<PolymarketEventRaw[]> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.offset != null) searchParams.set("offset", String(params.offset));
  if (params.active != null) searchParams.set("active", String(params.active));
  if (params.closed != null) searchParams.set("closed", String(params.closed));

  const url = `${API_BASE}/api/polymarket/events?${searchParams.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Polymarket API error: ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid Polymarket events response");
  }
  return data as PolymarketEventRaw[];
}

export async function checkPolymarketHealth(): Promise<{
  ok: boolean;
  latencyMs?: number;
}> {
  const API_BASE =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      : "";
  try {
    const res = await fetch(`${API_BASE}/api/polymarket/health`);
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && (data.ok === true || data.status === "ok"),
      latencyMs: data.latencyMs,
    };
  } catch {
    return { ok: false };
  }
}

/** Fetch a single Polymarket event by ID (for detail page). */
export async function fetchPolymarketEvent(
  eventId: string
): Promise<PolymarketEventRaw> {
  const url = `${API_BASE}/api/polymarket/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Polymarket event not found: ${res.status}`);
  }

  const data = await res.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Polymarket event response");
  }
  return data as PolymarketEventRaw;
}
