import { Router, Request, Response } from "express";
import { getTrades } from "../services/kalshiClient";
import { AxiosError } from "axios";

const router = Router();

// GET /api/trades — Fetch trades (query: ticker, limit, cursor, min_ts, max_ts)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { ticker, limit, cursor, min_ts, max_ts } = req.query;
    const params: Record<string, string | number> = {};
    if (ticker) params.ticker = ticker as string;
    if (limit) params.limit = parseInt(limit as string, 10);
    if (cursor) params.cursor = cursor as string;
    if (min_ts) params.min_ts = parseInt(min_ts as string, 10);
    if (max_ts) params.max_ts = parseInt(max_ts as string, 10);

    const data = await getTrades(params);

    res.json({
      success: true,
      data: data.trades,
      cursor: data.cursor || null,
      count: data.trades ? data.trades.length : 0,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error fetching trades:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

export default router;
