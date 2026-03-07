# CRE WASM Crypto Constraints

Documented from building the `place-bet` workflow.

## NPM Packages in WASM

- CRE compiles TS → JS → WASM via Javy. Node.js APIs (`crypto`, `fs`, `http`) do NOT exist at runtime
- Packages using Node.js internals compile fine but **trap at runtime** (`wasm unreachable instruction`)
- **Fails**: `ethers`, `@polymarket/clob-client`, anything using `crypto.subtle`, `Buffer`, `fetch`
- **Works**: `@noble/secp256k1` v3, `@noble/hashes` v2 — pure JS, zero native deps
- `viem` listed as supported in CRE docs but untested in WASM context

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

- v3 exports `sign`, `getPublicKey` directly — no namespace object
- `sign()` with `{ prehash: false, format: 'recovered' }` → 65 bytes: **recovery(1) + r(32) + s(32)** (NOT r+s+recovery)

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

## Consensus Gotchas

- `HTTPClient.sendRequest` with `consensusIdenticalAggregation` runs on all DON nodes
- If your callback produces different results per node (e.g. timestamp-based signatures), consensus WILL fail in production
- In simulation (single node) this works fine but will break on real DON
- For signing operations that vary per invocation, consider pre-computing outside the consensus callback

## Key Debugging Lessons

- `B64.indexOf("=")` returns `-1` — must check for `"="` padding explicitly in base64 decode
- Salt values must stay within `Number.MAX_SAFE_INTEGER` to avoid JSON precision loss
- Polymarket order payload requires `deferExec: false` field
- Polymarket API key must be created (POST `/auth/api-key`) before it can be derived (GET `/auth/derive-api-key`)
