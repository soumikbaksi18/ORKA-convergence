export interface MarketParams {
  limit?: number;
  cursor?: string;
  event_ticker?: string;
  series_ticker?: string;
  status?: "unopened" | "open" | "closed" | "settled";
  tickers?: string;
}

export interface EventParams {
  limit?: number;
  cursor?: string;
  series_ticker?: string;
  status?: string;
  with_nested_markets?: boolean;
}

export interface Market {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle: string;
  status: string;
  open_time: string;
  close_time: string;
  expiration_time: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  [key: string]: unknown;
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  sub_title: string;
  category: string;
  mutually_exclusive: boolean;
  [key: string]: unknown;
}

export interface MarketsResponse {
  markets: Market[];
  cursor: string;
}

export interface MarketResponse {
  market: Market;
}

export interface EventsResponse {
  events: KalshiEvent[];
  cursor: string;
}

export interface EventResponse {
  event: KalshiEvent;
  markets?: Market[];
}

export interface SeriesResponse {
  series: unknown;
}
