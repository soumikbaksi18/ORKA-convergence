import type { Context } from "hono";
import { getEvents } from "../lib/api/events";
import { getTags } from "../lib/api/tags";
import { getCached, setCache } from "../helpers/cache";

export async function fetchHomepageStats(c: Context) {
  const limit = Number(c.req.query("limit")) || 20;
  const offset = Number(c.req.query("offset")) || 0;
  const tag = c.req.query("tag");

  const cacheKey = `homepage:${limit}:${offset}:${tag ?? ""}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const [events, tags] = await Promise.all([
    getEvents({
      active: true,
      closed: false,
      limit,
      offset,
      ...(tag ? { tag } : {}),
    }),
    getTags(),
  ]);

  const result = {
    events,
    tags,
    pagination: {
      limit,
      offset,
      hasMore: events.length === limit,
    },
  };

  setCache(cacheKey, result);
  return c.json(result);
}
