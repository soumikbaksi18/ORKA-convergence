import {
  HTTPCapability,
  handler,
  Runner,
  type Runtime,
  type HTTPPayload,
  HTTPClient,
  consensusIdenticalAggregation,
} from "@chainlink/cre-sdk";
import {
  checkOpenMarket,
  type MarketValidation,
} from "./lib/polymarket.lib.ts";
import { createOrDeriveApiKey, placeOrder } from "./lib/polymarket-order.lib.ts";
import { placeKalshiOrder } from "./lib/kalshi-order.lib.ts";

export type Config = {};

type PolymarketInput = {
  platform: "polymarket";
  marketId: string;
  clobId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
};

type KalshiInput = {
  platform: "kalshi";
  ticker: string;
  action: "buy" | "sell";
  side: "yes" | "no";
  count: number;
  price: number;
  kalshiAuth: {
    accessKey: string;
    accessSignature: string;
    accessTimestamp: string;
  };
};

export type HTTPInput = PolymarketInput | KalshiInput;

export const onHttpTrigger = (
  runtime: Runtime<Config>,
  payload: HTTPPayload,
): string => {
  const input = new TextDecoder().decode(payload.input);
  const parsedInput = JSON.parse(input) as HTTPInput;
  const httpClient = new HTTPClient();

  if (parsedInput.platform === "kalshi") {
    return handleKalshi(runtime, httpClient, parsedInput);
  } else if (parsedInput.platform === "polymarket") {
    return handlePolymarket(runtime, httpClient, parsedInput);
  }

  return JSON.stringify({ success: false, error: `Unknown platform: ${(parsedInput as any).platform}` });
};

function handleKalshi(
  runtime: Runtime<Config>,
  httpClient: HTTPClient,
  input: KalshiInput,
): string {
  runtime.log(`Kalshi order: ticker=${input.ticker} action=${input.action} side=${input.side}`);

  const placeOrderFn = httpClient.sendRequest<[string, string], string>(
    runtime,
    (sendRequester, paramsJson, authJson) => {
      const p = JSON.parse(paramsJson);
      const a = JSON.parse(authJson);
      return placeKalshiOrder(sendRequester, p, a);
    },
    consensusIdenticalAggregation(),
  );

  const orderParams = {
    ticker: input.ticker,
    action: input.action,
    side: input.side,
    count: input.count,
    price: input.price,
  };

  const orderRes = placeOrderFn(
    JSON.stringify(orderParams),
    JSON.stringify(input.kalshiAuth),
  ).result();

  runtime.log(`Kalshi order result: ${orderRes}`);
  return JSON.stringify({ success: true, order: JSON.parse(orderRes) });
}

function handlePolymarket(
  runtime: Runtime<Config>,
  httpClient: HTTPClient,
  input: PolymarketInput,
): string {
  runtime.log(`HTTP trigger: marketId=${input.marketId} clobId=${input.clobId}`);

  // Step 1: Validate market
  const fetchMarket = httpClient.sendRequest<[string, string], string>(
    runtime,
    (sendRequester, marketId, clobId) =>
      checkOpenMarket(sendRequester, marketId, clobId),
    consensusIdenticalAggregation(),
  );

  const marketRes = fetchMarket(input.marketId, input.clobId).result();
  const validation = JSON.parse(marketRes) as MarketValidation;

  runtime.log(`Market validation: ${JSON.stringify(validation)}`);

  if (!validation.valid) {
    return JSON.stringify({ success: false, error: validation.error });
  }

  // Step 2: Get private key from secrets
  const secret = runtime
    .getSecret({ id: "PRIVATE_KEY", namespace: "" })
    .result();
  const privateKey = secret.value;

  // Step 3: Derive API key via L1 auth
  const deriveApiKeyFn = httpClient.sendRequest<[string], string>(
    runtime,
    (sendRequester, pk) => {
      const creds = createOrDeriveApiKey(sendRequester, pk);
      return JSON.stringify(creds);
    },
    consensusIdenticalAggregation(),
  );

  const credsRes = deriveApiKeyFn(privateKey).result();
  const creds = JSON.parse(credsRes);

  runtime.log(`API key derived: ${creds.key}`);

  // Step 4: Place order
  const placeOrderFn = httpClient.sendRequest<[string, string, string], string>(
    runtime,
    (sendRequester, pk, credsJson, paramsJson) => {
      const c = JSON.parse(credsJson);
      const p = JSON.parse(paramsJson);
      return placeOrder(sendRequester, pk, c, p);
    },
    consensusIdenticalAggregation(),
  );

  const orderParams = {
    tokenId: input.clobId,
    price: input.price,
    size: input.size,
    side: input.side,
    negRisk: validation.negRisk,
    tickSize: validation.orderPriceMinTickSize,
  };

  const orderRes = placeOrderFn(
    privateKey,
    JSON.stringify(creds),
    JSON.stringify(orderParams),
  ).result();

  runtime.log(`Order result: ${orderRes}`);
  return JSON.stringify({ success: true, order: JSON.parse(orderRes) });
}

export const initWorkflow = (_config: Config) => {
  const http = new HTTPCapability();
  return [handler(http.trigger({ authorizedKeys: [] }), onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
