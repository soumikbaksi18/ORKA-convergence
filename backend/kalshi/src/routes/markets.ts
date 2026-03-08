import { Router, Request, Response } from "express";
import {
  getMarkets,
  getMarket,
  getOrderbook,
  getCandlesticks,
} from "../services/kalshiClient";
import { MarketParams, CandlestickParams } from "../types/kalshi";
import { AxiosError } from "axios";

const router = Router();

// GET /api/markets — Fetch all markets (with optional filters)
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      limit, cursor, event_ticker, series_ticker, status, tickers,
      min_created_ts, max_created_ts, min_updated_ts,
      max_close_ts, min_close_ts, min_settled_ts, max_settled_ts,
      mve_filter,
    } = req.query;

    const params: MarketParams = {};
    if (limit) params.limit = parseInt(limit as string, 10);
    if (cursor) params.cursor = cursor as string;
    if (event_ticker) params.event_ticker = event_ticker as string;
    if (series_ticker) params.series_ticker = series_ticker as string;
    if (status) params.status = status as MarketParams["status"];
    if (tickers) params.tickers = tickers as string;
    if (min_created_ts) params.min_created_ts = parseInt(min_created_ts as string, 10);
    if (max_created_ts) params.max_created_ts = parseInt(max_created_ts as string, 10);
    if (min_updated_ts) params.min_updated_ts = parseInt(min_updated_ts as string, 10);
    if (max_close_ts) params.max_close_ts = parseInt(max_close_ts as string, 10);
    if (min_close_ts) params.min_close_ts = parseInt(min_close_ts as string, 10);
    if (min_settled_ts) params.min_settled_ts = parseInt(min_settled_ts as string, 10);
    if (max_settled_ts) params.max_settled_ts = parseInt(max_settled_ts as string, 10);
    if (mve_filter) params.mve_filter = mve_filter as MarketParams["mve_filter"];

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

// GET /api/markets/:ticker/orderbook
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
      data_fp: data.orderbook_fp || null,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(`Error fetching orderbook ${req.params.ticker}:`, error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/markets/:ticker/candlesticks
router.get("/:ticker/candlesticks", async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { series_ticker, start_ts, end_ts, period_interval, include_latest_before_start } = req.query;

    if (!series_ticker || !start_ts || !end_ts || !period_interval) {
      res.status(400).json({
        success: false,
        error: "Required query params: series_ticker, start_ts, end_ts, period_interval",
      });
      return;
    }

    const params: CandlestickParams = {
      start_ts: parseInt(start_ts as string, 10),
      end_ts: parseInt(end_ts as string, 10),
      period_interval: parseInt(period_interval as string, 10) as CandlestickParams["period_interval"],
    };
    if (include_latest_before_start === "true") {
      params.include_latest_before_start = true;
    }

    const data = await getCandlesticks(series_ticker as string, ticker as string, params);

    res.json({
      success: true,
      data: data.candlesticks,
      ticker: data.ticker,
      count: data.candlesticks ? data.candlesticks.length : 0,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(`Error fetching candlesticks ${req.params.ticker}:`, error.message);
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
