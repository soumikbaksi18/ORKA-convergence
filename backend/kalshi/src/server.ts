import "dotenv/config";
import express from "express";
import cors from "cors";

import marketsRouter from "./routes/markets";
import eventsRouter from "./routes/events";
import seriesRouter from "./routes/series";
import tradesRouter from "./routes/trades";
import ordersRouter from "./routes/orders";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/markets", marketsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/series", seriesRouter);
app.use("/api/trades", tradesRouter);
app.use("/api/orders", ordersRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "kalshi-integration" });
});

// Root — list all available endpoints
app.get("/", (_req, res) => {
  res.json({
    service: "Kalshi Integration Server",
    endpoints: {
      // Markets (public)
      "GET /api/markets":
        "Fetch markets (query: limit, cursor, event_ticker, series_ticker, status, tickers, mve_filter, timestamp filters)",
      "GET /api/markets/:ticker": "Fetch a single market by ticker",
      "GET /api/markets/:ticker/orderbook": "Fetch orderbook (query: depth)",
      "GET /api/markets/:ticker/candlesticks":
        "Fetch candlesticks (query: series_ticker, start_ts, end_ts, period_interval)",
      // Trades (public)
      "GET /api/trades":
        "Fetch trades (query: ticker, limit, cursor, min_ts, max_ts)",
      // Events (public)
      "GET /api/events":
        "Fetch events (query: limit, cursor, series_ticker, status, with_nested_markets)",
      "GET /api/events/:event_ticker": "Fetch a single event with its markets",
      // Series (public)
      "GET /api/series": "Fetch all series (top-level categories)",
      "GET /api/series/:series_ticker": "Fetch a single series",
      "GET /api/series/:series_ticker/markets":
        "Fetch all markets in a series (query: limit, cursor, status)",
      // Orders (authenticated)
      "GET /api/orders":
        "Fetch orders (query: ticker, event_ticker, status, limit, cursor) [auth]",
      "POST /api/orders":
        "Create order (body: ticker, side, action, count, price) [auth]",
      "POST /api/orders/batch": "Batch create orders (body: orders[]) [auth]",
      "DELETE /api/orders/:order_id": "Cancel an order [auth]",
      // Health
      "GET /health": "Health check",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Kalshi Integration Server running on http://localhost:${PORT}`);
});
