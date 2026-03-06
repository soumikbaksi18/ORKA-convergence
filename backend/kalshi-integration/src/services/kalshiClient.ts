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
