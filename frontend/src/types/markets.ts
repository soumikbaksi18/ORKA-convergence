/** Market from Kalshi integration API (GET /api/markets) */
export interface Market {
  ticker: string;
  event_ticker?: string;
  market_type?: string;
  title: string;
  subtitle?: string;
  status?: string;
  open_time?: string;
  close_time?: string;
  expiration_time?: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  open_interest?: number;
  [key: string]: unknown;
}

export interface MarketsApiResponse {
  success: boolean;
  data: Market[];
  cursor: string | null;
  count: number;
}

export interface MarketApiResponse {
  success: boolean;
  data: Market;
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker?: string;
  title: string;
  sub_title?: string;
  category?: string;
  mutually_exclusive?: boolean;
  [key: string]: unknown;
}

export interface EventApiResponse {
  success: boolean;
  data: KalshiEvent;
  markets: Market[];
}
