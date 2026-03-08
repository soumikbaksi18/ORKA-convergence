import type { Context } from "hono";
import { getEventDetail } from "../lib/api/events";
import { getCached, setCache } from "../helpers/cache";
import type { PolymarketEvent } from "../lib/api/events";

export async function fetchEventDetail(c: Context) {
  const id = c.req.param("id");

  if (!id) {
    throw new Error("id is required");
  }

  const cacheKey = `event:${id}`;
  const cached = getCached<PolymarketEvent>(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const event = await getEventDetail(id);
  setCache(cacheKey, event);

  return c.json(event);
}
