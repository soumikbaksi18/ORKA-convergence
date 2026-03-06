import type { HTTPSendRequester } from "@chainlink/cre-sdk";
import { POLYMARKET } from "../constants";
import { httpGet } from "../utils";

export type MarketValidation = {
  valid: boolean;
  error?: string;
  negRisk: boolean;
  orderPriceMinTickSize: string;
};

export const checkOpenMarket = (
  sendRequester: HTTPSendRequester,
  marketId: string,
  clobId: string,
): string => {
  const res = httpGet(
    sendRequester,
    `${POLYMARKET.BASE_URL}/markets/${marketId}`,
  );
  const data = JSON.parse(res);

  if (data.closed) {
    return JSON.stringify({
      valid: false,
      error: "market is closed",
    } as MarketValidation);
  }

  const clobTokenIds: string[] = JSON.parse(data.clobTokenIds || "[]");
  if (!clobTokenIds.includes(clobId)) {
    return JSON.stringify({
      valid: false,
      error: `clobId ${clobId} not in market clobTokenIds: ${clobTokenIds.join(", ")}`,
    } as MarketValidation);
  }

  return JSON.stringify({
    valid: true,
    negRisk: data.negRisk === true,
    orderPriceMinTickSize: data.orderPriceMinTickSize,
  } as MarketValidation);
};
