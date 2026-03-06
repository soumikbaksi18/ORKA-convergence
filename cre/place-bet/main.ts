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

export type Config = {};

export type HTTPInput = {
  marketId: string;
  clobId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
};

export const onHttpTrigger = (
  runtime: Runtime<Config>,
  payload: HTTPPayload,
): string => {
  const input = new TextDecoder().decode(payload.input);
  const parsedInput = JSON.parse(input) as HTTPInput;

  runtime.log(
    `HTTP trigger: marketId=${parsedInput.marketId} clobId=${parsedInput.clobId}`,
  );

  const httpClient = new HTTPClient();

  // Step 1: Validate market
  const fetchMarket = httpClient.sendRequest<[string, string], string>(
    runtime,
    (sendRequester, marketId, clobId) =>
      checkOpenMarket(sendRequester, marketId, clobId),
    consensusIdenticalAggregation(),
  );

  const marketRes = fetchMarket(
    parsedInput.marketId,
    parsedInput.clobId,
  ).result();
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
    tokenId: parsedInput.clobId,
    price: parsedInput.price,
    size: parsedInput.size,
    side: parsedInput.side,
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
};

export const initWorkflow = (_config: Config) => {
  const http = new HTTPCapability();
  return [handler(http.trigger({ authorizedKeys: [] }), onHttpTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
