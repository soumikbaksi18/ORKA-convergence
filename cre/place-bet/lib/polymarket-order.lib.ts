import type { HTTPSendRequester } from "@chainlink/cre-sdk";
import { POLYMARKET } from "../constants";
import { httpGet, httpPost, signOrder, signClobAuth, buildHmacSignature, getAddress, type OrderData } from "../utils";

export type OrderParams = {
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  negRisk: boolean;
  tickSize: string;
};

export type ApiKeyCreds = {
  key: string;
  secret: string;
  passphrase: string;
};

// --- rounding helpers (ported from clob-client) ---

const ROUNDING: Record<string, { price: number; size: number; amount: number }> = {
  "0.1": { price: 1, size: 2, amount: 3 },
  "0.01": { price: 2, size: 2, amount: 4 },
  "0.001": { price: 3, size: 2, amount: 5 },
  "0.0001": { price: 4, size: 2, amount: 6 },
};

function roundDown(num: number, dec: number): number {
  return Math.floor(num * 10 ** dec) / 10 ** dec;
}

function roundNormal(num: number, dec: number): number {
  return Math.round((num + Number.EPSILON) * 10 ** dec) / 10 ** dec;
}

function roundUp(num: number, dec: number): number {
  return Math.ceil(num * 10 ** dec) / 10 ** dec;
}

function decimalPlaces(num: number): number {
  if (Number.isInteger(num)) return 0;
  const parts = num.toString().split(".");
  return parts.length <= 1 ? 0 : parts[1].length;
}

function parseUnits(value: string, decimals: number): bigint {
  const [int, frac = ""] = value.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(int + padded);
}

function generateSalt(): string {
  // Keep within Number.MAX_SAFE_INTEGER to avoid precision loss in JSON
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

// --- create or derive API key via L1 auth ---

function buildL1Headers(privateKey: string, address: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = 0;
  const signature = signClobAuth(privateKey, POLYMARKET.CHAIN_ID, address, timestamp, nonce);
  return {
    POLY_ADDRESS: address,
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: String(timestamp),
    POLY_NONCE: String(nonce),
  };
}

export function createOrDeriveApiKey(
  sendRequester: HTTPSendRequester,
  privateKey: string,
): ApiKeyCreds {
  const address = getAddress(privateKey);

  // Try create first (POST)
  try {
    const createRes = httpPost(
      sendRequester,
      `${POLYMARKET.HOST}/auth/api-key`,
      "",
      { headers: buildL1Headers(privateKey, address) },
    );
    const data = JSON.parse(createRes);
    if (data.apiKey) {
      return { key: data.apiKey, secret: data.secret, passphrase: data.passphrase };
    }
  } catch (_) {
    // create failed, fall through to derive
  }

  // Fall back to derive (GET)
  const deriveRes = httpGet(
    sendRequester,
    `${POLYMARKET.HOST}/auth/derive-api-key`,
    { headers: buildL1Headers(privateKey, address) },
  );
  const data = JSON.parse(deriveRes);
  return { key: data.apiKey, secret: data.secret, passphrase: data.passphrase };
}

// --- build & post order ---

export function placeOrder(
  sendRequester: HTTPSendRequester,
  privateKey: string,
  creds: ApiKeyCreds,
  params: OrderParams,
): string {
  const address = getAddress(privateKey);
  const rc = ROUNDING[params.tickSize] || ROUNDING["0.01"];
  const sideNum = params.side === "BUY" ? 0 : 1;

  // compute raw amounts
  const rawPrice = roundNormal(params.price, rc.price);
  let rawMakerAmt: number;
  let rawTakerAmt: number;

  if (params.side === "BUY") {
    rawTakerAmt = roundDown(params.size, rc.size);
    rawMakerAmt = rawTakerAmt * rawPrice;
    if (decimalPlaces(rawMakerAmt) > rc.amount) {
      rawMakerAmt = roundUp(rawMakerAmt, rc.amount + 4);
      if (decimalPlaces(rawMakerAmt) > rc.amount) {
        rawMakerAmt = roundDown(rawMakerAmt, rc.amount);
      }
    }
  } else {
    rawMakerAmt = roundDown(params.size, rc.size);
    rawTakerAmt = rawMakerAmt * rawPrice;
    if (decimalPlaces(rawTakerAmt) > rc.amount) {
      rawTakerAmt = roundUp(rawTakerAmt, rc.amount + 4);
      if (decimalPlaces(rawTakerAmt) > rc.amount) {
        rawTakerAmt = roundDown(rawTakerAmt, rc.amount);
      }
    }
  }

  const makerAmount = parseUnits(rawMakerAmt.toString(), POLYMARKET.COLLATERAL_DECIMALS).toString();
  const takerAmount = parseUnits(rawTakerAmt.toString(), POLYMARKET.COLLATERAL_DECIMALS).toString();

  const exchangeAddress = params.negRisk ? POLYMARKET.NEG_RISK_EXCHANGE : POLYMARKET.EXCHANGE;

  const order: OrderData = {
    salt: generateSalt(),
    maker: address,
    signer: address,
    taker: "0x0000000000000000000000000000000000000000",
    tokenId: params.tokenId,
    makerAmount,
    takerAmount,
    expiration: "0",
    nonce: "0",
    feeRateBps: "0",
    side: sideNum,
    signatureType: POLYMARKET.SIGNATURE_TYPE,
  };

  const signature = signOrder(privateKey, POLYMARKET.CHAIN_ID, exchangeAddress, order);

  const orderPayload = {
    deferExec: false,
    order: {
      salt: Number(order.salt),
      maker: order.maker,
      signer: order.signer,
      taker: order.taker,
      tokenId: order.tokenId,
      makerAmount: order.makerAmount,
      takerAmount: order.takerAmount,
      side: params.side,
      expiration: order.expiration,
      nonce: order.nonce,
      feeRateBps: order.feeRateBps,
      signatureType: order.signatureType,
      signature,
    },
    owner: creds.key,
    orderType: "GTC",
  };

  const body = JSON.stringify(orderPayload);
  const endpoint = "/order";
  const timestamp = Math.floor(Date.now() / 1000);
  const hmacSig = buildHmacSignature(creds.secret, timestamp, "POST", endpoint, body);

  const res = httpPost(sendRequester, `${POLYMARKET.HOST}${endpoint}`, body, {
    headers: {
      "Content-Type": "application/json",
      POLY_ADDRESS: address,
      POLY_SIGNATURE: hmacSig,
      POLY_TIMESTAMP: String(timestamp),
      POLY_API_KEY: creds.key,
      POLY_PASSPHRASE: creds.passphrase,
    },
  });

  return res;
}
