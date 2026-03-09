import type { Market } from "@/types/markets";

/** Polymarket integration: all functions call Next.js /api/polymarket/* routes, which fetch from Gamma API (gamma-api.polymarket.com) via proxy. */
const API_BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : "";

/** Minimal Polymarket API types (gamma-api response). Gamma may return numbers as strings. */
export interface PolymarketMarketRaw {
  id: string;
  conditionId: string;
  question: string;
  /** JSON string "[\"0.95\", \"0.05\"]" or array ["0.95", "0.05"] */
  outcomePrices?: string | string[];
  bestBid?: number | string;
  bestAsk?: number | string;
  lastTradePrice?: number | string;
  volumeNum?: number | string;
  volume24hr?: number | string;
  liquidityNum?: number | string;
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

/** Parse outcomePrices (string "[\"0.95\", \"0.05\"]" or array ["0.95", "0.05"]) -> [yesCents, noCents]. */
function parseOutcomePrices(
  outcomePrices: string | string[] | undefined
): [number, number] {
  if (outcomePrices == null) return [0, 0];
  let arr: string[];
  if (Array.isArray(outcomePrices)) {
    arr = outcomePrices;
  } else if (typeof outcomePrices === "string") {
    try {
      arr = JSON.parse(outcomePrices) as string[];
    } catch {
      return [0, 0];
    }
  } else {
    return [0, 0];
  }
  const yes = Math.round((parseFloat(String(arr[0] ?? "0")) || 0) * 100);
  const no = Math.round((parseFloat(String(arr[1] ?? "0")) || 0) * 100);
  return [yes, no];
}

function toNum(v: number | string | undefined | null): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Normalize a Polymarket market to the shared Market shape for the table. */
export function polymarketMarketToMarket(
  pm: PolymarketMarketRaw,
  eventTicker?: string,
  eventImageUrl?: string
): Market {
  const [yesPrice, noPrice] = parseOutcomePrices(
    pm.outcomePrices ?? (pm as Record<string, unknown>).outcome_prices
  );
  const lastTradeNum = toNum(
    pm.lastTradePrice ?? (pm as Record<string, unknown>).last_trade_price
  );
  const lastPrice =
    lastTradeNum > 0 && lastTradeNum <= 1
      ? Math.round(lastTradeNum * 100)
      : lastTradeNum > 1 && lastTradeNum <= 100
        ? Math.round(lastTradeNum)
        : yesPrice;
  const finalLastPrice = lastPrice > 0 ? lastPrice : yesPrice;
  const bestBidNum = toNum(pm.bestBid ?? (pm as Record<string, unknown>).best_bid);
  const bestAskNum = toNum(pm.bestAsk ?? (pm as Record<string, unknown>).best_ask);
  const bestBid =
    bestBidNum > 0 && bestBidNum <= 1
      ? Math.round(bestBidNum * 100)
      : bestBidNum > 100
        ? Math.round(bestBidNum)
        : bestBidNum > 0
          ? Math.round(bestBidNum)
          : 0;
  const bestAsk =
    bestAskNum > 0 && bestAskNum <= 1
      ? Math.round(bestAskNum * 100)
      : bestAskNum >= 100
        ? Math.round(bestAskNum)
        : bestAskNum > 0
          ? Math.round(bestAskNum)
          : 100;

  const imageUrl = pm.image || pm.icon || eventImageUrl || undefined;

  return {
    ticker: `poly-${pm.id}`,
    event_ticker: eventTicker ?? `poly-event-${pm.conditionId}`,
    market_type: "binary",
    title: pm.question ?? "",
    status: pm.closed ? "closed" : pm.active ? "open" : "unknown",
    latest_expiration_time: pm.endDate ?? undefined,
    yes_bid: bestBid > 0 ? Math.round(bestBid) : yesPrice,
    yes_ask: bestAsk < 100 ? Math.round(bestAsk) : 100 - noPrice,
    no_bid: noPrice,
    no_ask: 100 - yesPrice,
    last_price: finalLastPrice,
    volume: toNum(pm.volumeNum ?? (pm as Record<string, unknown>).volume),
    volume_24h: toNum(
      pm.volume24hr ??
        (pm as Record<string, unknown>).volume_24hr ??
        (pm as Record<string, unknown>).volume24h
    ),
    open_interest: toNum(pm.liquidityNum),
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

/** Gamma API order: volume_24hr | volume | liquidity | start_date | end_date | competitive | closed_time */
export interface FetchPolymarketEventsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  order?: "volume_24hr" | "volume" | "liquidity" | "start_date" | "end_date" | "competitive" | "closed_time";
  ascending?: boolean;
  /** Gamma API tag_slug for category filter (e.g. politics, sports, crypto, finance, tech) */
  tag_slug?: string;
}

export async function fetchPolymarketEvents(
  params: FetchPolymarketEventsParams = {}
): Promise<PolymarketEventRaw[]> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.offset != null) searchParams.set("offset", String(params.offset));
  if (params.active != null) searchParams.set("active", String(params.active));
  if (params.closed != null) searchParams.set("closed", String(params.closed));
  if (params.order != null) searchParams.set("order", params.order);
  if (params.ascending != null) searchParams.set("ascending", String(params.ascending));
  if (params.tag_slug != null && params.tag_slug !== "") searchParams.set("tag_slug", params.tag_slug);

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
