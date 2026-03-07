# Overview

This is the main code for the cre execution layer to place bets and do other things with cre using the capability of chainlink cre

# What is CRE

Chainlink Runtime Environment — sandboxed execution env where devs deploy and run decentralized workflows on a DON (Decentralized Oracle Network).

## Key Terms

- **Workflow**: unit of work that executes logic in response to triggers, made up of handlers
- **Handler**: function containing business logic, runs when a trigger fires
- **Trigger**: event that starts a workflow (cron, HTTP request, on-chain log)
- **Callback**: mechanism for workflows to return results back to requesting systems
- **DON**: network of independent oracle nodes running workflows collectively
- **Runtime / NodeRuntime**: SDK components exposing capabilities for interacting w/ execution env and node infra
- **Capability**: specific function/service CRE provides (data fetching, blockchain interaction, etc.)
- **Consensus**: agreement mechanism among DON nodes determining final workflow results
- **Secrets**: sensitive data (API keys, creds) securely managed and injected into workflows
- **EVMClient**: SDK client for read/write to EVM-compatible chains from within workflows
- **HTTPClient**: SDK client for making HTTP requests to external APIs from workflows

---

# place-bet Workflow

## Overview

This place-bet workflow will be used to place bets from the different polymarket clients (kalshi, polymarket as of now) using their apis or sdks

## Capabilities Used

### 1. HTTP Trigger

Initiates workflow via external HTTP requests. Uses cryptographic authorization keys to ensure only legit requests execute the workflow.

**Config** (`main.ts`):

```ts
import {
  HTTPCapability,
  handler,
  Runner,
  type Runtime,
  type HTTPPayload,
} from "@chainlink/cre-sdk";

// trigger setup — authorizedKeys controls who can fire the trigger
const http = new HTTPCapability();
handler(http.trigger({ authorizedKeys: [] }), onHttpTrigger);
```

**Handler signature**:

```ts
(runtime: Runtime<Config>, payload: HTTPPayload) => string;
```

- `payload.input` — raw bytes of the HTTP request body, decode w/ `TextDecoder`
- Return value is the workflow output

**Simulation**: `cre workflow simulate <path> --target=staging-settings`

- Can provide input via interactive mode, inline JSON, or file
- Simulation vs production behavior may differ — test edge cases before deploying

### 2. Confidential HTTP Client

Privacy-preserving HTTP requests from within workflows. Requests run inside secure enclaves, secrets injected without exposure, responses encrypted.

```ts
import { ConfidentialHttpClient } from "@chainlink/cre-sdk";

const client = new ConfidentialHttpClient();

// GET w/ secret injection
const res = await client.get("https://api.example.com/data", {
  secrets: { apiKey: "your-secret-key" },
});

// POST
const res = await client.post("https://api.example.com/action", body, options);

// Generic
const res = await client.request(config);
```

- Use `{{secretName}}` template syntax in URLs/headers to inject secrets during enclave execution
- Response shape: `{ status, statusText, body, headers }`

### 3. HTTP Client

Standard (non-confidential) HTTP requests w/ built-in consensus for secure offchain data. Supports GET and POST.

```ts
import { HTTPClient } from "@chainlink/cre-sdk";

const client = new HTTPClient();

// GET
const res = await client.get("https://api.example.com/data");
const data = JSON.parse(res.body);

// POST
const res = await client.post("https://api.example.com/action", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "value" }),
});
```

- Response shape: `{ status, body, headers }`
- Consensus-validated — DON nodes agree on the response before workflow continues
- Use `sendRequest` pattern for caching and single-execution guarantees via `cacheSettings`
- Use this for public APIs; use **Confidential HTTP Client** when secrets/privacy needed

---

# CRE WASM Runtime Constraints & Learnings

Documented from building the `place-bet` workflow. See `memory/cre-wasm-crypto.md` for detailed notes.

## NPM Packages in WASM

- CRE compiles TS to WASM via Javy. Node.js APIs (`crypto`, `fs`, `http`) do NOT exist at runtime
- Packages that use Node.js internals compile fine but **trap at runtime** (`wasm unreachable instruction`)
- **What fails**: `ethers`, `@polymarket/clob-client`, anything using `crypto.subtle`, `Buffer`, `fetch`
- **What works**: `@noble/secp256k1` v3, `@noble/hashes` v2 — pure JS, zero native deps
- `viem` is listed as supported in CRE docs but untested in WASM context

## Noble Libraries Setup

```ts
// Imports MUST use .js suffix (package exports require it)
import { keccak_256 } from "@noble/hashes/sha3.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { sign, getPublicKey, hashes } from "@noble/secp256k1";

// REQUIRED: set sync hash functions before using sign()
hashes.sha256 = (msg) => sha256(msg);
hashes.hmacSha256 = (key, msg) => hmac(sha256, key, msg);
```

- `sign()` with `{ prehash: false, format: 'recovered' }` → 65 bytes: **recovery(1) + r(32) + s(32)** (NOT r+s+recovery)
- v3 exports `sign`, `getPublicKey` directly — no namespace object

## Browser/Global APIs Missing in WASM

- `atob` / `btoa` — **NOT available**. Must implement base64 encode/decode manually
- `crypto.subtle` — NOT available
- `fetch` — NOT available (use CRE `HTTPClient` instead)
- `TextEncoder` / `TextDecoder` — available
- `Math.random()` — available
- `Date.now()` — available

## Secrets

- Declare in `cre/secrets.yaml` under `secretsNames: - name: SECRET_NAME`
- Point `secrets-path` in `workflow.yaml` to the secrets file
- Set env var matching the secret name before simulation: `export SECRET_NAME="value"`
- Access in handler: `runtime.getSecret({ id: "SECRET_NAME", namespace: "" }).result().value`
- `Runtime<C>` extends `SecretsProvider` so `getSecret` is available directly in handlers

## Consensus Gotchas

- `HTTPClient.sendRequest` with `consensusIdenticalAggregation` runs on all DON nodes
- If your callback produces different results per node (e.g. timestamp-based signatures), consensus WILL fail in production
- In simulation (single node) this works fine but will break on real DON
- For signing operations that vary per invocation, consider pre-computing outside the consensus callback

## Polymarket Integration (place-bet)

### Architecture

All signing done with pure JS crypto (`@noble/*`), all HTTP via CRE `HTTPClient.sendRequest`:

1. **Market validation** — GET gamma API, check closed + clobId membership
2. **API key creation** — L1 auth via EIP-712 `ClobAuth` signing → POST `/auth/api-key` (create) or GET `/auth/derive-api-key` (existing)
3. **Order placement** — EIP-712 order signing + HMAC L2 headers → POST `/order`

### Key Files

- `utils/crypto.ts` — EIP-712 signing, HMAC, address derivation, base64 encode/decode
- `lib/polymarket-order.lib.ts` — order building, amount rounding, API key derivation, order posting
- `lib/polymarket.lib.ts` — market validation against gamma API
- `constants/index.ts` — Polymarket URLs, chain ID, contract addresses
- `scripts/approve-usdc.ts` — one-time USDC allowance approval for CTF Exchange contracts

### Prerequisites for Order Placement

- Wallet must have USDC on Polygon
- Wallet must approve CTF Exchange contracts to spend USDC (run `scripts/approve-usdc.ts`)
- `PRIVATE_KEY` env var must be set for simulation
