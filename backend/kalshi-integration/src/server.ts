import "dotenv/config";
import express from "express";
import cors from "cors";

import marketsRouter from "./routes/markets";
import eventsRouter from "./routes/events";
import seriesRouter from "./routes/series";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/markets", marketsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/series", seriesRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "kalshi-integration" });
});

// Root — list all available endpoints
app.get("/", (_req, res) => {
  res.json({
    service: "Kalshi Integration Server",
    endpoints: {
      "GET /api/markets":
        "Fetch all markets (query: limit, cursor, event_ticker, series_ticker, status, tickers)",
      "GET /api/markets/:ticker": "Fetch a single market by ticker",
      "GET /api/events":
        "Fetch all events (query: limit, cursor, series_ticker, status, with_nested_markets)",
      "GET /api/events/:event_ticker": "Fetch a single event with its markets",
      "GET /api/series": "Fetch all series (top-level categories)",
      "GET /api/series/:series_ticker": "Fetch a single series",
      "GET /api/series/:series_ticker/markets":
        "Fetch all markets in a series (query: limit, cursor, status)",
      "GET /health": "Health check",
    },
  });
});

app.listen(PORT, () => {
  console.log(`Kalshi Integration Server running on http://localhost:${PORT}`);
});
