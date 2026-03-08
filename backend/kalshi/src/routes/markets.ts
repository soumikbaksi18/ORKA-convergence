import { Router, Request, Response } from "express";
import {
  getMarkets,
  getMarket,
  getOrderbook,
  getTrades,
} from "../services/kalshiClient";
import { MarketParams } from "../types/kalshi";
import { AxiosError } from "axios";

const router = Router();

// GET /api/markets — Fetch all markets (with optional filters)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, cursor, event_ticker, series_ticker, status, tickers } =
      req.query;

    const params: MarketParams = {};
    if (limit) params.limit = parseInt(limit as string, 10);
    if (cursor) params.cursor = cursor as string;
    if (event_ticker) params.event_ticker = event_ticker as string;
    if (series_ticker) params.series_ticker = series_ticker as string;
    if (status) params.status = status as MarketParams["status"];
    if (tickers) params.tickers = tickers as string;

    const data = await getMarkets(params);

    res.json({
      success: true,
      data: data.markets,
      cursor: data.cursor || null,
      count: data.markets ? data.markets.length : 0,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error fetching markets:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/markets/:ticker/orderbook — Fetch orderbook for a market (must be before /:ticker)
router.get("/:ticker/orderbook", async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const depth = req.query.depth
      ? parseInt(req.query.depth as string, 10)
      : 10;
    const data = await getOrderbook(ticker as string, depth);

    res.json({
      success: true,
      data: data.orderbook,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(
      `Error fetching orderbook ${req.params.ticker}:`,
      error.message,
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/markets/:ticker — Fetch a single market by ticker
router.get("/:ticker", async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const data = await getMarket(ticker as string);

    res.json({
      success: true,
      data: data.market,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(`Error fetching market ${req.params.ticker}:`, error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

export default router;
