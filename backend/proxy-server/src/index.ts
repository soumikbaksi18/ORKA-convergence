import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  ALLOWED_DOMAINS: string;
  PROXY_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS — allow all origins
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "convergence-proxy" });
});

// Proxy endpoint — accepts ANY method
app.all("/proxy", async (c) => {
  const targetUrl = c.req.header("X-Target-URL");
  if (!targetUrl) {
    return c.json({ error: "Missing X-Target-URL header" }, 400);
  }

  // Validate URL format
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return c.json({ error: "Invalid X-Target-URL" }, 400);
  }

  // Check domain allowlist
  const allowedDomains = c.env.ALLOWED_DOMAINS.split(",").map((d) => d.trim());
  if (!allowedDomains.includes(parsed.hostname)) {
    return c.json(
      { error: `Domain not allowed: ${parsed.hostname}` },
      403
    );
  }

  // Optional secret check
  if (c.env.PROXY_SECRET) {
    const secret = c.req.header("X-Proxy-Secret");
    if (secret !== c.env.PROXY_SECRET) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  // Build headers to forward (strip proxy-specific and hop-by-hop headers)
  const skipHeaders = new Set([
    "host",
    "x-target-url",
    "x-proxy-secret",
    "cf-connecting-ip",
    "cf-ray",
    "cf-visitor",
    "cf-worker",
    "cf-ipcountry",
    "connection",
    "keep-alive",
    "transfer-encoding",
  ]);

  const forwardHeaders = new Headers();
  for (const [key, value] of c.req.raw.headers.entries()) {
    if (!skipHeaders.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  // Forward the request
  const method = c.req.method;
  const body =
    method !== "GET" && method !== "HEAD"
      ? await c.req.arrayBuffer()
      : undefined;

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
    });

    // Build response, forwarding status and headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      // Skip hop-by-hop headers
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    }

    const responseBody = await response.arrayBuffer();

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: `Proxy fetch failed: ${message}` }, 502);
  }
});

// Convenience: also support path-based proxying
// Usage: GET /proxy/https://api.elections.kalshi.com/trade-api/v2/markets?limit=5
app.all("/proxy/*", async (c) => {
  const targetUrl = c.req.path.replace("/proxy/", "");
  const queryString = new URL(c.req.url).search;
  const fullUrl = targetUrl + queryString;

  // Rewrite as if it came through the header-based route
  const newHeaders = new Headers(c.req.raw.headers);
  newHeaders.set("X-Target-URL", fullUrl);

  const newReq = new Request(c.req.url.replace(c.req.path, "/proxy"), {
    method: c.req.method,
    headers: newHeaders,
    body:
      c.req.method !== "GET" && c.req.method !== "HEAD"
        ? await c.req.arrayBuffer()
        : undefined,
  });

  return app.fetch(newReq, c.env, c.executionCtx);
});

export default app;
