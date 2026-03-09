// ── Query Params ──

export interface MarketParams {
  limit?: number;
  cursor?: string;
  event_ticker?: string;
  series_ticker?: string;
  status?: "unopened" | "open" | "paused" | "closed" | "settled";
  tickers?: string;
  min_created_ts?: number;
  max_created_ts?: number;
  min_updated_ts?: number;
  max_close_ts?: number;
  min_close_ts?: number;
  min_settled_ts?: number;
  max_settled_ts?: number;
  mve_filter?: "only" | "exclude";
}

export interface EventParams {
  limit?: number;
  cursor?: string;
  series_ticker?: string;
  status?: string;
  with_nested_markets?: boolean;
}

export interface TradeParams {
  limit?: number;
  cursor?: string;
  ticker?: string;
  min_ts?: number;
  max_ts?: number;
}

export interface CandlestickParams {
  start_ts: number;
  end_ts: number;
  period_interval: 1 | 60 | 1440;
  include_latest_before_start?: boolean;
}

export interface OrderParams {
  ticker?: string;
  event_ticker?: string;
  min_ts?: number;
  max_ts?: number;
  status?: "resting" | "canceled" | "executed";
  limit?: number;
  cursor?: string;
  subaccount?: number;
}

// ── Market ──

export interface PriceRange {
  start: string;
  end: string;
  step: string;
}

export interface Market {
  ticker: string;
  event_ticker: string;
  market_type: "binary" | "scalar";
  yes_sub_title?: string;
  no_sub_title?: string;
  created_time: string;
  updated_time?: string;
  open_time: string;
  close_time: string;
  latest_expiration_time?: string;
  settlement_timer_seconds?: number;
  status: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid_dollars?: string;
  no_ask_dollars?: string;
  yes_bid_size_fp?: string;
  yes_ask_size_fp?: string;
  last_price_dollars?: string;
  previous_yes_bid_dollars?: string;
  previous_yes_ask_dollars?: string;
  previous_price_dollars?: string;
  notional_value_dollars?: string;
  volume_fp?: string;
  volume_24h_fp?: string;
  open_interest_fp?: string;
  result?: "yes" | "no" | "scalar" | "";
  can_close_early?: boolean;
  fractional_trading_enabled?: boolean;
  rules_primary?: string;
  rules_secondary?: string;
  price_level_structure?: string;
  price_ranges?: PriceRange[];
  // legacy cent-based fields
  title?: string;
  subtitle?: string;
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

// ── Event ──

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  sub_title: string;
  category: string;
  mutually_exclusive: boolean;
  [key: string]: unknown;
}

// ── Orderbook ──

export interface Orderbook {
  yes: [number, number][];
  no: [number, number][];
  yes_dollars?: [string, number][];
  no_dollars?: [string, number][];
}

export interface OrderbookFp {
  yes_dollars?: [string, string][];
  no_dollars?: [string, string][];
}

// ── Candlestick ──

export interface OhlcData {
  open?: number;
  open_dollars?: string;
  low?: number;
  low_dollars?: string;
  high?: number;
  high_dollars?: string;
  close?: number;
  close_dollars?: string;
  mean?: number;
  mean_dollars?: string;
  previous?: number;
  previous_dollars?: string;
}

export interface Candlestick {
  end_period_ts: number;
  yes_bid: OhlcData;
  yes_ask: OhlcData;
  price: OhlcData;
  volume: number;
  volume_fp: string;
  open_interest: number;
  open_interest_fp: string;
}

// ── Trade ──

export interface Trade {
  trade_id: string;
  ticker: string;
  price?: number;
  count: number;
  count_fp?: string;
  yes_price: number;
  no_price: number;
  yes_price_dollars?: string;
  no_price_dollars?: string;
  taker_side: "yes" | "no";
  created_time: string;
  [key: string]: unknown;
}

// ── Order ──

export interface Order {
  order_id: string;
  user_id: string;
  client_order_id?: string;
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
  fill_count_fp?: string;
  remaining_count: number;
  remaining_count_fp?: string;
  initial_count: number;
  initial_count_fp?: string;
  taker_fees: number;
  maker_fees: number;
  taker_fill_cost: number;
  maker_fill_cost: number;
  taker_fill_cost_dollars?: string;
  maker_fill_cost_dollars?: string;
  expiration_time?: string | null;
  created_time: string;
  last_update_time: string;
  self_trade_prevention_type?: "taker_at_cross" | "maker" | null;
  order_group_id?: string | null;
  cancel_order_on_pause?: boolean;
  subaccount_number?: number | null;
  [key: string]: unknown;
}

export interface CreateOrderRequest {
  ticker: string;
  side: "yes" | "no";
  action: "buy" | "sell";
  count?: number;
  count_fp?: string;
  client_order_id?: string;
  yes_price?: number;
  no_price?: number;
  yes_price_dollars?: string;
  no_price_dollars?: string;
  expiration_ts?: number;
  time_in_force?: "fill_or_kill" | "good_till_canceled" | "immediate_or_cancel";
  buy_max_cost?: number;
  post_only?: boolean;
  reduce_only?: boolean;
  self_trade_prevention_type?: "taker_at_cross" | "maker";
  order_group_id?: string;
  cancel_order_on_pause?: boolean;
  subaccount?: number;
}

// ── Responses ──

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

export interface OrderbookResponse {
  orderbook: Orderbook;
  orderbook_fp?: OrderbookFp;
}

export interface CandlestickResponse {
  ticker: string;
  candlesticks: Candlestick[];
}

export interface TradesResponse {
  trades: Trade[];
  cursor: string;
}

export interface OrderResponse {
  order: Order;
}

export interface OrdersResponse {
  orders: Order[];
  cursor: string;
}

export interface CancelOrderResponse {
  order: Order;
  reduced_by: number;
  reduced_by_fp: string;
}

export interface BatchOrderResult {
  client_order_id: string | null;
  order: Order | null;
  error: { code: string; message: string; details?: string } | null;
}

export interface BatchCreateOrdersResponse {
  orders: BatchOrderResult[];
}

// Event metadata (images)
export interface MarketMetadata {
  market_ticker: string;
  image_url: string;
  color_code: string;
}

export interface GetEventMetadataResponse {
  image_url: string;
  featured_image_url?: string;
  market_details: MarketMetadata[];
  settlement_sources: unknown[];
  competition?: string;
  competition_scope?: string;
}
