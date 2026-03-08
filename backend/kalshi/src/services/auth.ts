import crypto from "crypto";

/**
 * Generate Kalshi API auth headers using RSA-PSS signing.
 *
 * Kalshi requires three headers:
 *   KALSHI-ACCESS-KEY       — your API key ID
 *   KALSHI-ACCESS-TIMESTAMP — current time in ms (string)
 *   KALSHI-ACCESS-SIGNATURE — RSA-PSS signature of (timestamp + method + path)
 */
export function getAuthHeaders(
  method: string,
  path: string
): Record<string, string> {
  const apiKey = process.env.KALSHI_API_KEY;
  const privateKeyPem = process.env.KALSHI_PRIVATE_KEY;

  if (!apiKey || !privateKeyPem) {
    throw new Error(
      "KALSHI_API_KEY and KALSHI_PRIVATE_KEY must be set in environment"
    );
  }

  const timestamp = Date.now().toString();

  // Message to sign: timestamp + method + path (no body)
  const message = timestamp + method.toUpperCase() + path;

  const signature = crypto
    .sign("sha256", Buffer.from(message), {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    })
    .toString("base64");

  return {
    "KALSHI-ACCESS-KEY": apiKey,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
    "KALSHI-ACCESS-SIGNATURE": signature,
  };
}
