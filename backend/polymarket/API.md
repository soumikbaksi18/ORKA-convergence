# Polymarket API

Base URL: `http://localhost:3131`

---

## GET /fetch-homepage-data

Returns active, open events with tags and pagination.

**Query Parameters**

| Param  | Type   | Default | Description          |
|--------|--------|---------|----------------------|
| limit  | number | 20      | Number of events     |
| offset | number | 0       | Pagination offset    |
| tag    | string | —       | Filter by tag slug   |

**Response**

```json
{
  "events": [{ ... }],
  "tags": [{ ... }],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Caching**: 1 minute TTL, keyed by limit + offset + tag.

---

## GET /event/:id

Returns a single event by ID with its markets.

**Path Parameters**

| Param | Type   | Description       |
|-------|--------|-------------------|
| id    | string | Polymarket event ID |

**Response**

```json
{
  "id": "16167",
  "title": "MicroStrategy sells any Bitcoin by ___ ?",
  "slug": "microstrategy-sell-any-bitcoin-in-2025",
  "active": true,
  "markets": [
    {
      "id": "516926",
      "question": "...",
      "clobTokenIds": "[\"token1\", \"token2\"]",
      "outcomePrices": "[\"0.95\", \"0.05\"]",
      ...
    }
  ],
  ...
}
```

**Caching**: 1 minute TTL, keyed by event ID.

**Note**: `clobTokenIds` is a JSON string — parse it to get token IDs for the orderbook endpoint.

---

## GET /orderbook/:tokenId

Returns the live orderbook for a specific CLOB token.

**Path Parameters**

| Param   | Type   | Description                              |
|---------|--------|------------------------------------------|
| tokenId | string | CLOB token ID (from market's `clobTokenIds`) |

**Response**

```json
{
  "market": "0x8e7a...",
  "asset_id": "11025...",
  "timestamp": "1772963761795",
  "bids": [
    { "price": "0.05", "size": "1555.06" }
  ],
  "asks": [
    { "price": "0.06", "size": "1325.63" }
  ],
  "min_order_size": "5",
  "tick_size": "0.01",
  "neg_risk": false,
  "last_trade_price": "0.050"
}
```

**Caching**: None — returns live data.

---

## Typical Flow

1. `GET /fetch-homepage-data` — browse active events
2. `GET /event/:id` — get event detail + markets
3. Parse `clobTokenIds` from a market
4. `GET /orderbook/:tokenId` — get live orderbook for a token
