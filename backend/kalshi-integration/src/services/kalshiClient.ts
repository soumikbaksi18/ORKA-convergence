import axios from "axios";
import {
  MarketParams,
  EventParams,
  MarketsResponse,
  MarketResponse,
  EventsResponse,
  EventResponse,
  SeriesResponse,
} from "../types/kalshi";

const BASE_URL =
  process.env.KALSHI_BASE_URL || "https://demo-api.kalshi.co/trade-api/v2";

const kalshiApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

export async function getMarkets(
  params: MarketParams = {}
): Promise<MarketsResponse> {
  const response = await kalshiApi.get<MarketsResponse>("/markets", { params });
  return response.data;
}

export async function getMarket(ticker: string): Promise<MarketResponse> {
  const response = await kalshiApi.get<MarketResponse>(`/markets/${ticker}`);
  return response.data;
}

export async function getEvents(
  params: EventParams = {}
): Promise<EventsResponse> {
  const response = await kalshiApi.get<EventsResponse>("/events", { params });
  return response.data;
}

export async function getEvent(
  eventTicker: string,
  withNestedMarkets: boolean = true
): Promise<EventResponse> {
  const response = await kalshiApi.get<EventResponse>(
    `/events/${eventTicker}`,
    { params: { with_nested_markets: withNestedMarkets } }
  );
  return response.data;
}

export async function getSeries(
  params: Record<string, string> = {}
): Promise<SeriesResponse> {
  const response = await kalshiApi.get<SeriesResponse>("/series", { params });
  return response.data;
}

export async function getSeriesByTicker(
  seriesTicker: string
): Promise<SeriesResponse> {
  const response = await kalshiApi.get<SeriesResponse>(
    `/series/${seriesTicker}`
  );
  return response.data;
}

/** Orderbook: yes/no arrays of [price_cents, count] */
export interface OrderbookResponse {
  orderbook: { yes: [number, number][]; no: [number, number][] };
  orderbook_fp?: unknown;
}

export async function getOrderbook(
  ticker: string,
  depth: number = 10
): Promise<OrderbookResponse> {
  const response = await kalshiApi.get<OrderbookResponse>(
    `/markets/${ticker}/orderbook`,
    { params: { depth } }
  );
  return response.data;
}

export interface Trade {
  trade_id: string;
  ticker: string;
  yes_price: number;
  no_price: number;
  count: number;
  taker_side: string;
  created_time: string;
  [key: string]: unknown;
}

export interface TradesResponse {
  trades: Trade[];
  cursor: string;
}

export async function getTrades(params: {
  ticker?: string;
  limit?: number;
  cursor?: string;
  min_ts?: number;
  max_ts?: number;
} = {}): Promise<TradesResponse> {
  const response = await kalshiApi.get<TradesResponse>("/markets/trades", {
    params: params as Record<string, string | number>,
  });
  return response.data;
}
