# Kalshi Integration API Routes

**Base URL:** `http://localhost:4000`

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "cursor": "string | null",
  "count": 0
}
```

On error:

```json
{
  "success": false,
  "error": "error message"
}
```

---

## Markets

### GET `/api/markets`

Fetch a paginated list of markets.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Results per page (default: 100, max: 1000) |
| `cursor` | string | Pagination cursor from previous response |
| `event_ticker` | string | Filter by event ticker |
| `series_ticker` | string | Filter by series ticker |
| `status` | string | `unopened` \| `open` \| `paused` \| `closed` \| `settled` |
| `tickers` | string | Comma-separated list of market tickers |
| `mve_filter` | string | `only` (multivariate only) \| `exclude` (exclude multivariate) |
| `min_close_ts` | number | Unix timestamp — markets closing after this time |
| `max_close_ts` | number | Unix timestamp — markets closing before this time |
| `min_created_ts` | number | Unix timestamp — created after |
| `max_created_ts` | number | Unix timestamp — created before |
| `min_updated_ts` | number | Unix timestamp — updated after |
| `min_settled_ts` | number | Unix timestamp — settled after |
| `max_settled_ts` | number | Unix timestamp — settled before |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/markets?limit=10&status=open");
const { data, cursor, count } = await res.json();
// data: Market[]
```

**Response `data` fields (Market object):**

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | Unique market identifier |
| `event_ticker` | string | Parent event identifier |
| `market_type` | string | `binary` or `scalar` |
| `status` | string | Market status |
| `yes_bid_dollars` | string | Best yes bid price (e.g. `"0.6500"`) |
| `yes_ask_dollars` | string | Best yes ask price |
| `no_bid_dollars` | string | Best no bid price |
| `no_ask_dollars` | string | Best no ask price |
| `last_price_dollars` | string | Last trade price |
| `volume_fp` | string | Total volume (fixed-point) |
| `volume_24h_fp` | string | 24h volume (fixed-point) |
| `open_interest_fp` | string | Open interest (fixed-point) |
| `open_time` | string | ISO 8601 datetime |
| `close_time` | string | ISO 8601 datetime |
| `result` | string | `yes` \| `no` \| `""` (empty if unsettled) |
| `can_close_early` | boolean | Whether market can close early |

---

### GET `/api/markets/:ticker`

Fetch a single market by ticker.

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/markets/KXBTC-26MAR08");
const { data } = await res.json();
// data: Market
```

---

### GET `/api/markets/:ticker/orderbook`

Fetch the orderbook for a market.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `depth` | number | 10 | Number of price levels (0 = all) |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/markets/KXBTC-26MAR08/orderbook?depth=5");
const { data, data_fp } = await res.json();
// data.yes: [[price_cents, count], ...]
// data.no: [[price_cents, count], ...]
// data_fp: fixed-point version (dollars)
```

---

### GET `/api/markets/:ticker/candlesticks`

Fetch OHLC candlestick data for a market.

**Query Parameters (all required except `include_latest_before_start`):**

| Param | Type | Description |
|-------|------|-------------|
| `series_ticker` | string | **Required.** Series the market belongs to |
| `start_ts` | number | **Required.** Unix timestamp — start of range |
| `end_ts` | number | **Required.** Unix timestamp — end of range |
| `period_interval` | number | **Required.** Candle duration in minutes: `1`, `60`, or `1440` |
| `include_latest_before_start` | string | `"true"` to prepend the last candle before start |

**Example:**

```ts
const res = await fetch(
  "http://localhost:4000/api/markets/KXBTC-26MAR08/candlesticks?" +
  "series_ticker=KXBTC&start_ts=1709856000&end_ts=1709942400&period_interval=60"
);
const { data, count } = await res.json();
// data: Candlestick[]
```

**Candlestick object:**

| Field | Type | Description |
|-------|------|-------------|
| `end_period_ts` | number | Unix timestamp of candle end |
| `yes_bid` | object | OHLC for yes bid (`open_dollars`, `high_dollars`, `low_dollars`, `close_dollars`) |
| `yes_ask` | object | OHLC for yes ask |
| `price` | object | OHLC for trade price |
| `volume` | number | Contracts traded |
| `volume_fp` | string | Fixed-point volume |
| `open_interest` | number | Open interest at candle end |

---

## Trades

### GET `/api/trades`

Fetch recent trades.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `ticker` | string | Filter by market ticker |
| `limit` | number | Results per page (default: 100, max: 1000) |
| `cursor` | string | Pagination cursor |
| `min_ts` | number | Unix timestamp — trades after |
| `max_ts` | number | Unix timestamp — trades before |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/trades?ticker=KXBTC-26MAR08&limit=20");
const { data, cursor } = await res.json();
// data: Trade[]
```

**Trade object:**

| Field | Type | Description |
|-------|------|-------------|
| `trade_id` | string | Unique trade identifier |
| `ticker` | string | Market ticker |
| `yes_price` | number | Yes price in cents |
| `no_price` | number | No price in cents |
| `yes_price_dollars` | string | Yes price in dollars |
| `no_price_dollars` | string | No price in dollars |
| `count` | number | Number of contracts |
| `taker_side` | string | `yes` or `no` |
| `created_time` | string | ISO 8601 datetime |

---

## Events

### GET `/api/events`

Fetch events (categories of markets).

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Results per page |
| `cursor` | string | Pagination cursor |
| `series_ticker` | string | Filter by series |
| `status` | string | Filter by status |
| `with_nested_markets` | string | `"true"` to include nested markets |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/events?limit=10&with_nested_markets=true");
const { data, cursor, count } = await res.json();
// data: KalshiEvent[]
```

---

### GET `/api/events/:event_ticker`

Fetch a single event with its markets.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `with_nested_markets` | string | `"true"` | Set to `"false"` to exclude markets |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/events/KXBTC-26MAR08");
const { data, markets } = await res.json();
// data: KalshiEvent
// markets: Market[]
```

---

## Series

### GET `/api/series`

Fetch all series (top-level categories like "Crypto", "Politics").

### GET `/api/series/:series_ticker`

Fetch a single series by ticker.

### GET `/api/series/:series_ticker/markets`

Fetch all markets belonging to a series.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Results per page |
| `cursor` | string | Pagination cursor |
| `status` | string | Filter by status |

---

## Orders (Authenticated)

> These endpoints require `KALSHI_API_KEY` and `KALSHI_PRIVATE_KEY` to be configured on the backend. RSA-PSS signing is handled automatically.

### GET `/api/orders`

Fetch your orders.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `ticker` | string | Filter by market ticker |
| `event_ticker` | string | Filter by event ticker (comma-separated, max 10) |
| `status` | string | `resting` \| `canceled` \| `executed` |
| `limit` | number | Results per page (max: 200) |
| `cursor` | string | Pagination cursor |
| `min_ts` | number | Unix timestamp — orders after |
| `max_ts` | number | Unix timestamp — orders before |
| `subaccount` | number | Subaccount number (0 = primary) |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/orders?status=resting&limit=50");
const { data, cursor } = await res.json();
// data: Order[]
```

---

### POST `/api/orders`

Create a new order.

**Request Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ticker` | string | Yes | Market ticker |
| `side` | string | Yes | `yes` or `no` |
| `action` | string | Yes | `buy` or `sell` |
| `count` | number | No | Number of contracts (min: 1) |
| `count_fp` | string | No | Fixed-point count (e.g. `"5.50"`) |
| `yes_price` | number | No | Price in cents (1-99) |
| `no_price` | number | No | Price in cents (1-99) |
| `yes_price_dollars` | string | No | Price in dollars (e.g. `"0.6500"`) |
| `no_price_dollars` | string | No | Price in dollars |
| `time_in_force` | string | No | `fill_or_kill` \| `good_till_canceled` \| `immediate_or_cancel` |
| `expiration_ts` | number | No | Unix timestamp in ms |
| `client_order_id` | string | No | Your custom order ID |
| `post_only` | boolean | No | Maker-only order |
| `reduce_only` | boolean | No | Only reduce existing position |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ticker: "KXBTC-26MAR08",
    side: "yes",
    action: "buy",
    count: 10,
    yes_price: 65
  })
});
const { data } = await res.json();
// data: Order (status 201)
```

---

### POST `/api/orders/batch`

Create multiple orders at once (max 20).

**Request Body:**

```json
{
  "orders": [
    { "ticker": "...", "side": "yes", "action": "buy", "count": 5, "yes_price": 60 },
    { "ticker": "...", "side": "no", "action": "buy", "count": 3, "no_price": 40 }
  ]
}
```

**Response `data`:** Array of `{ client_order_id, order, error }` — each entry has either `order` or `error` populated.

---

### DELETE `/api/orders/:order_id`

Cancel a resting order.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `subaccount` | number | Optional subaccount number |

**Example:**

```ts
const res = await fetch("http://localhost:4000/api/orders/abc-123-def", {
  method: "DELETE"
});
const { data, reduced_by } = await res.json();
// data: Order (with status "canceled")
// reduced_by: number of contracts canceled
```

---

## Health

### GET `/health`

```json
{ "status": "ok", "service": "kalshi-integration" }
```

---

## Pagination

Most list endpoints support cursor-based pagination. The response includes a `cursor` field — pass it as a query param to get the next page:

```ts
// First page
const page1 = await fetch("/api/markets?limit=100");
const { data, cursor } = await page1.json();

// Next page
const page2 = await fetch(`/api/markets?limit=100&cursor=${cursor}`);
```

When `cursor` is `null` or empty, there are no more pages.

## Price Format

Kalshi returns prices in two formats:
- **Cents** (integer): `yes_price: 65` means $0.65
- **Dollars** (string): `yes_price_dollars: "0.6500"` — fixed-point with up to 4 decimals

Use the `_dollars` fields for display; use cent fields for order placement.
