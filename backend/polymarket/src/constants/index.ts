/* eslint-disable no-var */
declare var process: { env: Record<string, string | undefined> };

export const POLYMARKET_BASE_URL = "https://gamma-api.polymarket.com";
export const CLOB_BASE_URL = "https://clob.polymarket.com";
export const PROXY_URL = process.env.PROXY_URL || "";
