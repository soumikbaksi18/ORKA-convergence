import { Router, Request, Response } from "express";
import {
  createOrder,
  getOrders,
  cancelOrder,
  batchCreateOrders,
} from "../services/kalshiClient";
import { OrderParams, CreateOrderRequest } from "../types/kalshi";
import { AxiosError } from "axios";

const router = Router();

// GET /api/orders — Get orders (authenticated)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { ticker, event_ticker, min_ts, max_ts, status, limit, cursor, subaccount } =
      req.query;

    const params: OrderParams = {};
    if (ticker) params.ticker = ticker as string;
    if (event_ticker) params.event_ticker = event_ticker as string;
    if (min_ts) params.min_ts = parseInt(min_ts as string, 10);
    if (max_ts) params.max_ts = parseInt(max_ts as string, 10);
    if (status) params.status = status as OrderParams["status"];
    if (limit) params.limit = parseInt(limit as string, 10);
    if (cursor) params.cursor = cursor as string;
    if (subaccount) params.subaccount = parseInt(subaccount as string, 10);

    const data = await getOrders(params);

    res.json({
      success: true,
      data: data.orders,
      cursor: data.cursor || null,
      count: data.orders ? data.orders.length : 0,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error fetching orders:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// POST /api/orders — Create a new order (authenticated)
router.post("/", async (req: Request, res: Response) => {
  try {
    const body: CreateOrderRequest = req.body;

    if (!body.ticker || !body.side || !body.action) {
      res.status(400).json({
        success: false,
        error: "Required fields: ticker, side, action",
      });
      return;
    }

    const data = await createOrder(body);

    res.status(201).json({
      success: true,
      data: data.order,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error creating order:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// POST /api/orders/batch — Batch create orders (authenticated)
router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { orders } = req.body as { orders: CreateOrderRequest[] };

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({
        success: false,
        error: "Required: orders array with at least one order",
      });
      return;
    }

    if (orders.length > 20) {
      res.status(400).json({
        success: false,
        error: "Maximum 20 orders per batch",
      });
      return;
    }

    const data = await batchCreateOrders(orders);

    res.status(201).json({
      success: true,
      data: data.orders,
      count: data.orders.length,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error("Error batch creating orders:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

// DELETE /api/orders/:order_id — Cancel an order (authenticated)
router.delete("/:order_id", async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    const subaccount = req.query.subaccount
      ? parseInt(req.query.subaccount as string, 10)
      : undefined;

    const data = await cancelOrder(order_id as string, subaccount);

    res.json({
      success: true,
      data: data.order,
      reduced_by: data.reduced_by,
      reduced_by_fp: data.reduced_by_fp,
    });
  } catch (err) {
    const error = err as AxiosError<{ message?: string }>;
    console.error(`Error canceling order ${req.params.order_id}:`, error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
    });
  }
});

export default router;
