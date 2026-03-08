import axios, { AxiosRequestConfig } from "axios";
import { getAuthHeaders } from "./auth";
import {
  MarketParams,
  EventParams,
  TradeParams,
  CandlestickParams,
  OrderParams,
  CreateOrderRequest,
  MarketsResponse,
  MarketResponse,
  EventsResponse,
  EventResponse,
  SeriesResponse,
  OrderbookResponse,
  CandlestickResponse,
  TradesResponse,
  OrderResponse,
  OrdersResponse,
  CancelOrderResponse,
  BatchCreateOrdersResponse,
} from "../types/kalshi";

// ── Configuration ──

const KALSHI_BASE_URL =
  process.env.KALSHI_BASE_URL ||
  "https://api.elections.kalshi.com/trade-api/v2";

const PROXY_URL = process.env.PROXY_URL; // e.g. https://convergence-proxy.dipansrimany.workers.dev/proxy

// ── Core request helper ──

async function kalshiRequest<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, unknown> | object;
    data?: unknown;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { params: rawParams, data, auth = false } = options;
  const params = rawParams as Record<string, unknown> | undefined;
  const fullUrl = `${KALSHI_BASE_URL}${path}`;

  const config: AxiosRequestConfig = {
    method,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    params,
    data,
  };

  // Attach auth headers if required
  if (auth) {
    const url = new URL(fullUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    const signPath = url.pathname + url.search;
    const authHeaders = getAuthHeaders(method, signPath);
    Object.assign(config.headers!, authHeaders);
  }

  if (PROXY_URL) {
    // Route through proxy: send to proxy with X-Target-URL header
    config.url = PROXY_URL;
    config.headers!["X-Target-URL"] = fullUrl + buildQueryString(params);
    // When proxying, params are in X-Target-URL, not in axios params
    config.params = undefined;

    if (process.env.PROXY_SECRET) {
      config.headers!["X-Proxy-Secret"] = process.env.PROXY_SECRET;
    }
  } else {
    config.url = fullUrl;
  }

  const response = await axios.request<T>(config);
  return response.data;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null
  );
  if (entries.length === 0) return "";
  const qs = entries
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `?${qs}`;
}

// ── Public (no auth) endpoints ──

export async function getMarkets(
  params: MarketParams = {}
): Promise<MarketsResponse> {
  return kalshiRequest<MarketsResponse>("GET", "/markets", { params });
}

export async function getMarket(ticker: string): Promise<MarketResponse> {
  return kalshiRequest<MarketResponse>("GET", `/markets/${ticker}`);
}

export async function getOrderbook(
  ticker: string,
  depth: number = 10
): Promise<OrderbookResponse> {
  return kalshiRequest<OrderbookResponse>(
    "GET",
    `/markets/${ticker}/orderbook`,
    { params: { depth } }
  );
}

export async function getTrades(
  params: TradeParams = {}
): Promise<TradesResponse> {
  return kalshiRequest<TradesResponse>("GET", "/markets/trades", { params });
}

export async function getEvents(
  params: EventParams = {}
): Promise<EventsResponse> {
  return kalshiRequest<EventsResponse>("GET", "/events", { params });
}

export async function getEvent(
  eventTicker: string,
  withNestedMarkets: boolean = true
): Promise<EventResponse> {
  return kalshiRequest<EventResponse>("GET", `/events/${eventTicker}`, {
    params: { with_nested_markets: withNestedMarkets },
  });
}

export async function getSeries(
  params: Record<string, string> = {}
): Promise<SeriesResponse> {
  return kalshiRequest<SeriesResponse>("GET", "/series", { params });
}

export async function getSeriesByTicker(
  seriesTicker: string
): Promise<SeriesResponse> {
  return kalshiRequest<SeriesResponse>("GET", `/series/${seriesTicker}`);
}

export async function getCandlesticks(
  seriesTicker: string,
  ticker: string,
  params: CandlestickParams
): Promise<CandlestickResponse> {
  return kalshiRequest<CandlestickResponse>(
    "GET",
    `/series/${seriesTicker}/markets/${ticker}/candlesticks`,
    { params }
  );
}

// ── Authenticated endpoints ──

export async function createOrder(
  body: CreateOrderRequest
): Promise<OrderResponse> {
  return kalshiRequest<OrderResponse>("POST", "/portfolio/orders", {
    data: body,
    auth: true,
  });
}

export async function getOrders(
  params: OrderParams = {}
): Promise<OrdersResponse> {
  return kalshiRequest<OrdersResponse>("GET", "/portfolio/orders", {
    params,
    auth: true,
  });
}

export async function cancelOrder(
  orderId: string,
  subaccount?: number
): Promise<CancelOrderResponse> {
  return kalshiRequest<CancelOrderResponse>(
    "DELETE",
    `/portfolio/orders/${orderId}`,
    {
      params: subaccount !== undefined ? { subaccount } : undefined,
      auth: true,
    }
  );
}

export async function batchCreateOrders(
  orders: CreateOrderRequest[]
): Promise<BatchCreateOrdersResponse> {
  return kalshiRequest<BatchCreateOrdersResponse>(
    "POST",
    "/portfolio/orders/batched",
    { data: { orders }, auth: true }
  );
}
