import type { HTTPSendRequester } from "@chainlink/cre-sdk";
import { KALSHI } from "../constants";
import { httpPost } from "../utils";

export type KalshiOrderParams = {
  ticker: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  count: number;
  price: number; // cents 1-99
};

export type KalshiAuthHeaders = {
  accessKey: string;
  accessSignature: string;
  accessTimestamp: string;
};

export function placeKalshiOrder(
  sendRequester: HTTPSendRequester,
  params: KalshiOrderParams,
  auth: KalshiAuthHeaders,
): string {
  const body: Record<string, unknown> = {
    ticker: params.ticker,
    action: params.action,
    side: params.side,
    count: params.count,
    type: "limit",
  };

  if (params.side === "yes") {
    body.yes_price = params.price;
  } else {
    body.no_price = params.price;
  }

  const res = httpPost(
    sendRequester,
    `${KALSHI.BASE_URL}/trade-api/v2/portfolio/orders`,
    JSON.stringify(body),
    {
      headers: {
        "Content-Type": "application/json",
        "KALSHI-ACCESS-KEY": auth.accessKey,
        "KALSHI-ACCESS-SIGNATURE": auth.accessSignature,
        "KALSHI-ACCESS-TIMESTAMP": auth.accessTimestamp,
      },
    },
  );

  return res;
}
