/** Market from Kalshi integration API (GET /api/markets) */
export interface Market {
  ticker: string;
  event_ticker?: string;
  market_type?: "binary" | "scalar";
  // Real API uses yes_sub_title / no_sub_title; demo used title/subtitle
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  status?: string;
  open_time?: string;
  close_time?: string;
  expiration_time?: string;
  latest_expiration_time?: string;
  // Dollar-based prices (real API) — string like "0.6500"
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid_dollars?: string;
  no_ask_dollars?: string;
  last_price_dollars?: string;
  notional_value_dollars?: string;
  // Fixed-point volume/OI (real API) — string like "1234.00"
  yes_bid_size_fp?: string;
  yes_ask_size_fp?: string;
  volume_fp?: string;
  volume_24h_fp?: string;
  open_interest_fp?: string;
  // Legacy cent-based prices (also present in real API)
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  open_interest?: number;
  // Additional fields
  result?: "yes" | "no" | "scalar" | "";
  can_close_early?: boolean;
  fractional_trading_enabled?: boolean;
  rules_primary?: string;
  rules_secondary?: string;
  early_close_condition?: string;
  liquidity?: number;
  liquidity_dollars?: string;
  expected_expiration_time?: string;
  settlement_timer_seconds?: number;
  custom_strike?: Record<string, string>;
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

/** Order types for authenticated endpoints */
export interface Order {
  order_id: string;
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  type: "limit" | "market";
  status: "resting" | "canceled" | "executed";
  yes_price: number;
  no_price: number;
  yes_price_dollars?: string;
  no_price_dollars?: string;
  fill_count: number;
  remaining_count: number;
  initial_count: number;
  created_time: string;
  [key: string]: unknown;
}
