import { Router, Request, Response } from "express";
import { getEvents, getEvent, getEventMetadata } from "../services/kalshiClient";
import { EventParams } from "../types/kalshi";
import { AxiosError } from "axios";

const router = Router();

// GET /api/events/:event_ticker/metadata — Event metadata (e.g. image_url)
router.get("/:event_ticker/metadata", async (req: Request, res: Response) => {
  try {
    const { event_ticker } = req.params;
    const data = await getEventMetadata(event_ticker as string);
    res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(
      `Error fetching event metadata ${req.params.event_ticker}:`,
      error.message,
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/events — Fetch all events (categories of markets)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, cursor, series_ticker, status, with_nested_markets } =
      req.query;

    const params: EventParams = {};
    if (limit) params.limit = parseInt(limit as string, 10);
    if (cursor) params.cursor = cursor as string;
    if (series_ticker) params.series_ticker = series_ticker as string;
    if (status) params.status = status as string;
    if (with_nested_markets)
      params.with_nested_markets = with_nested_markets === "true";

    const data = await getEvents(params);

    res.json({
      success: true,
      data: data.events,
      cursor: data.cursor || null,
      count: data.events ? data.events.length : 0,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error fetching events:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// GET /api/events/:event_ticker — Fetch a single event with its markets
router.get("/:event_ticker", async (req: Request, res: Response) => {
  try {
    const { event_ticker } = req.params;
    const withMarkets = req.query.with_nested_markets !== "false";

    const data = await getEvent(event_ticker as string, withMarkets);

    res.json({
      success: true,
      data: data.event,
      markets: data.markets || [],
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(
      `Error fetching event ${req.params.event_ticker}:`,
      error.message,
    );
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

export default router;
