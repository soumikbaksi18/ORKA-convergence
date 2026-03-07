import { keccak_256 } from "@noble/hashes/sha3.js";
import { hmac as nobleHmac } from "@noble/hashes/hmac.js";
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
import { sign as secp256k1Sign, getPublicKey, hashes } from "@noble/secp256k1";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

// Set up sync hashes for secp256k1 (required for sync sign/verify)
hashes.sha256 = (msg: Uint8Array) => nobleSha256(msg);
hashes.hmacSha256 = (key: Uint8Array, msg: Uint8Array) =>
  nobleHmac(nobleSha256, key, msg);

// --- hex helpers ---

export const toHex = (bytes: Uint8Array): string => "0x" + bytesToHex(bytes);
export const fromHex = (hex: string): Uint8Array =>
  hexToBytes(hex.startsWith("0x") ? hex.slice(2) : hex);

// --- keccak256 ---

export const keccak256 = (data: Uint8Array): Uint8Array => keccak_256(data);
export const keccak256Hex = (data: Uint8Array): string =>
  toHex(keccak256(data));

// --- ABI encoding helpers ---

function padLeft(hex: string, byteLen: number): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return clean.padStart(byteLen * 2, "0");
}

function encodeUint256(value: string | number | bigint): string {
  return padLeft(BigInt(value).toString(16), 32);
}

function encodeAddress(address: string): string {
  return padLeft(address, 32);
}

// --- secp256k1 sign helper ---

function ecSign(
  digest: Uint8Array,
  privateKey: Uint8Array,
): { r: string; s: string; v: number } {
  // format: 'recovered' gives 65 bytes: recovery(1) + r(32) + s(32)
  const sig = secp256k1Sign(digest, privateKey, {
    prehash: false,
    format: "recovered",
  });
  const recovery = sig[0];
  const r = bytesToHex(sig.slice(1, 33));
  const s = bytesToHex(sig.slice(33, 65));
  return { r, s, v: recovery + 27 };
}

// --- EIP-712 ---

const EIP712_DOMAIN_TYPEHASH = keccak256Hex(
  new TextEncoder().encode(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
  ),
);

function hashDomain(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string,
): string {
  const nameHash = keccak256Hex(new TextEncoder().encode(name));
  const versionHash = keccak256Hex(new TextEncoder().encode(version));
  const encoded =
    EIP712_DOMAIN_TYPEHASH.slice(2) +
    nameHash.slice(2) +
    versionHash.slice(2) +
    encodeUint256(chainId) +
    encodeAddress(verifyingContract);
  return keccak256Hex(fromHex(encoded));
}

const ORDER_TYPEHASH = keccak256Hex(
  new TextEncoder().encode(
    "Order(uint256 salt,address maker,address signer,address taker,uint256 tokenId,uint256 makerAmount,uint256 takerAmount,uint256 expiration,uint256 nonce,uint256 feeRateBps,uint8 side,uint8 signatureType)",
  ),
);

export interface OrderData {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: number; // 0=BUY, 1=SELL
  signatureType: number; // 0=EOA
}

function hashOrder(order: OrderData): string {
  const encoded =
    ORDER_TYPEHASH.slice(2) +
    encodeUint256(order.salt) +
    encodeAddress(order.maker) +
    encodeAddress(order.signer) +
    encodeAddress(order.taker) +
    encodeUint256(order.tokenId) +
    encodeUint256(order.makerAmount) +
    encodeUint256(order.takerAmount) +
    encodeUint256(order.expiration) +
    encodeUint256(order.nonce) +
    encodeUint256(order.feeRateBps) +
    encodeUint256(order.side) +
    encodeUint256(order.signatureType);
  return keccak256Hex(fromHex(encoded));
}

export function signOrder(
  privateKey: string,
  chainId: number,
  exchangeAddress: string,
  order: OrderData,
): string {
  const domainHash = hashDomain(
    "Polymarket CTF Exchange",
    "1",
    chainId,
    exchangeAddress,
  );
  const orderHash = hashOrder(order);
  const digest = keccak256(
    fromHex("1901" + domainHash.slice(2) + orderHash.slice(2)),
  );
  const { r, s, v } = ecSign(digest, fromHex(privateKey));
  return "0x" + r + s + v.toString(16).padStart(2, "0");
}

// --- CLOB Auth EIP-712 (L1 headers) ---

const CLOB_AUTH_DOMAIN_TYPEHASH = keccak256Hex(
  new TextEncoder().encode(
    "EIP712Domain(string name,string version,uint256 chainId)",
  ),
);

const CLOB_AUTH_TYPEHASH = keccak256Hex(
  new TextEncoder().encode(
    "ClobAuth(address address,string timestamp,uint256 nonce,string message)",
  ),
);

function hashClobAuthDomain(chainId: number): string {
  const nameHash = keccak256Hex(new TextEncoder().encode("ClobAuthDomain"));
  const versionHash = keccak256Hex(new TextEncoder().encode("1"));
  const encoded =
    CLOB_AUTH_DOMAIN_TYPEHASH.slice(2) +
    nameHash.slice(2) +
    versionHash.slice(2) +
    encodeUint256(chainId);
  return keccak256Hex(fromHex(encoded));
}

export function signClobAuth(
  privateKey: string,
  chainId: number,
  address: string,
  timestamp: number,
  nonce: number,
): string {
  const msgToSign =
    "This message attests that I control the given wallet";
  const timestampHash = keccak256Hex(
    new TextEncoder().encode(String(timestamp)),
  );
  const messageHash = keccak256Hex(new TextEncoder().encode(msgToSign));
  const structHash = keccak256Hex(
    fromHex(
      CLOB_AUTH_TYPEHASH.slice(2) +
        encodeAddress(address) +
        timestampHash.slice(2) +
        encodeUint256(nonce) +
        messageHash.slice(2),
    ),
  );
  const domainHash = hashClobAuthDomain(chainId);
  const digest = keccak256(
    fromHex("1901" + domainHash.slice(2) + structHash.slice(2)),
  );
  const { r, s, v } = ecSign(digest, fromHex(privateKey));
  return "0x" + r + s + v.toString(16).padStart(2, "0");
}

// --- HMAC L2 headers ---

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToBytes(b64: string): Uint8Array {
  const sanitized = b64
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/[^A-Za-z0-9+/=]/g, "");
  const pad = sanitized.endsWith("==") ? 2 : sanitized.endsWith("=") ? 1 : 0;
  const len = (sanitized.length * 3) / 4 - pad;
  const bytes = new Uint8Array(len);
  let j = 0;
  for (let i = 0; i < sanitized.length; i += 4) {
    const a = B64.indexOf(sanitized[i]);
    const b = B64.indexOf(sanitized[i + 1]);
    const c = sanitized[i + 2] === "=" ? 0 : B64.indexOf(sanitized[i + 2]);
    const d = sanitized[i + 3] === "=" ? 0 : B64.indexOf(sanitized[i + 3]);
    const triplet = (a << 18) | (b << 12) | (c << 6) | d;
    if (j < len) bytes[j++] = (triplet >> 16) & 0xff;
    if (j < len) bytes[j++] = (triplet >> 8) & 0xff;
    if (j < len) bytes[j++] = triplet & 0xff;
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += B64[(a >> 2) & 0x3f];
    result += B64[((a << 4) | (b >> 4)) & 0x3f];
    result += i + 1 < bytes.length ? B64[((b << 2) | (c >> 6)) & 0x3f] : "=";
    result += i + 2 < bytes.length ? B64[c & 0x3f] : "=";
  }
  return result;
}

export function buildHmacSignature(
  secret: string,
  timestamp: number,
  method: string,
  requestPath: string,
  body?: string,
): string {
  let message = String(timestamp) + method + requestPath;
  if (body !== undefined) message += body;
  const keyBytes = base64ToBytes(secret);
  const msgBytes = new TextEncoder().encode(message);
  const sig = nobleHmac(nobleSha256, keyBytes, msgBytes);
  const b64 = bytesToBase64(sig);
  return b64.replace(/\+/g, "-").replace(/\//g, "_");
}

// --- Address from private key ---

export function getAddress(privateKey: string): string {
  const pubKey = getPublicKey(fromHex(privateKey), false);
  const hash = keccak256(pubKey.slice(1));
  const addr = toHex(hash.slice(12));
  return checksumAddress(addr);
}

function checksumAddress(address: string): string {
  const addr = address.toLowerCase().replace("0x", "");
  const hash = bytesToHex(keccak256(new TextEncoder().encode(addr)));
  let result = "0x";
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      result += addr[i].toUpperCase();
    } else {
      result += addr[i];
    }
  }
  return result;
}
