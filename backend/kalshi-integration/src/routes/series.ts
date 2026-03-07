import { Router, Request, Response } from "express";
import {
  getSeries,
  getSeriesByTicker,
  getMarkets,
} from "../services/kalshiClient";
import { MarketParams } from "../types/kalshi";
import { AxiosError } from "axios";

const router = Router();

// GET /api/series — Fetch all series (top-level categories)
router.get("/", async (req: Request, res: Response) => {
  try {
    const data = await getSeries(req.query as Record<string, string>);

    res.json({
      success: true,
      data: data.series || data,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error fetching series:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/series/:series_ticker — Fetch a single series by ticker
router.get("/:series_ticker", async (req: Request, res: Response) => {
  try {
    const { series_ticker } = req.params;
    const data = await getSeriesByTicker(series_ticker as string);

    res.json({
      success: true,
      data: data.series || data,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(
      `Error fetching series ${req.params.series_ticker}:`,
      error.message
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/series/:series_ticker/markets — Fetch all markets for a series
router.get(
  "/:series_ticker/markets",
  async (req: Request, res: Response) => {
    try {
      const { series_ticker } = req.params;
      const { limit, cursor, status } = req.query;

      const params: MarketParams = { series_ticker: series_ticker as string };
      if (limit) params.limit = parseInt(limit as string, 10);
      if (cursor) params.cursor = cursor as string;
      if (status) params.status = status as MarketParams["status"];

      const data = await getMarkets(params);

      res.json({
        success: true,
        series_ticker,
        data: data.markets,
        cursor: data.cursor || null,
        count: data.markets ? data.markets.length : 0,
      });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error(
        `Error fetching markets for series ${req.params.series_ticker}:`,
        error.message
      );
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }
);

export default router;
