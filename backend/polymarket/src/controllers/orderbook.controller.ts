import type { Context } from "hono";
import { getOrderBook } from "../lib/api/oderbook";

export async function fetchOrderbook(c: Context) {
  const tokenId = c.req.param("tokenId");

  if (!tokenId) {
    throw new Error("tokenId is required");
  }

  const orderbook = await getOrderBook(tokenId);
  return c.json(orderbook);
}
