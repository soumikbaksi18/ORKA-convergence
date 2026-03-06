import crypto from "node:crypto";
import path from "node:path";

const PRIVATE_KEY_PATH = path.resolve(import.meta.dir, "../../new-key.txt");

const API_KEY_ID =
  process.env.KALSHI_API_KEY_ID ??
  (() => {
    throw new Error("KALSHI_API_KEY_ID env var required");
  })();

const privateKeyPem = await Bun.file(PRIVATE_KEY_PATH).text();

function signPssText(text: string): string {
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(text);
  sign.end();
  const signature = sign.sign({
    key: privateKeyPem,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return signature.toString("base64");
}

export function getKalshiHeaders(method: string, apiPath: string) {
  const timestamp = Date.now().toString();
  const pathWithoutQuery = apiPath.split("?")[0];
  const msgString = timestamp + method.toUpperCase() + pathWithoutQuery;
  const signature = signPssText(msgString);

  return {
    "KALSHI-ACCESS-KEY": API_KEY_ID,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
  };
}

export const BASE_URL = "https://demo-api.kalshi.co";

// Print headers when run directly
const headers = getKalshiHeaders("GET", "/trade-api/v2/portfolio/balance");
console.log(headers);
