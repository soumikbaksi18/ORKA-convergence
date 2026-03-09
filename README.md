# Convergence — Unified Prediction Markets Platform

Convergence is a cross-platform prediction markets aggregator that unifies **Kalshi** and **Polymarket** into a single interface, powered by **Chainlink CRE (Compute Runtime Environment)** for trustless, on-chain order execution. An integrated AI agent provides real-time market analysis, helping traders make informed decisions across both centralized and decentralized prediction markets.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Chainlink CRE Workflow](#chainlink-cre-workflow)
- [Files Using Chainlink](#files-using-chainlink)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Video](#demo-video)
- [License](#license)

---

## Problem Statement

Prediction markets are fragmented across multiple platforms — Kalshi (regulated, centralized), Polymarket (crypto-native, decentralized), and others. Traders must juggle separate interfaces, authentication flows, and order systems. There is no unified way to browse, analyze, and trade across platforms, and no trustless execution layer that bridges Web2 APIs with blockchain settlement.

## Solution

Convergence solves this by:

1. **Aggregating markets** from Kalshi and Polymarket into a single, filterable dashboard with live orderbooks and price data
2. **Executing trades trustlessly** via a Chainlink CRE Workflow that validates markets, derives API credentials on-chain, and places orders across both platforms
3. **Providing AI-powered analysis** through an integrated chat agent that analyzes market data, sentiment, and pricing in real time

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Markets Dashboard │ Orderbooks │ AI Chat │ Agent View   │
└──────────┬──────────────────┬───────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌────────────────────┐
│  Kalshi Backend  │  │  Proxy Server      │
│  (Express + TS)  │  │  (Cloudflare       │
│  Auth, Markets,  │  │   Workers + Hono)  │
│  Orders, Trades  │  │  CORS proxy for    │
└────────┬─────────┘  │  Polymarket APIs   │
         │            └────────┬───────────┘
         │                     │
         ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│              Chainlink CRE Workflow (place-bet)          │
│                                                          │
│  HTTP Trigger → Platform Router                          │
│       ├── Kalshi: Auth headers → Place limit order       │
│       └── Polymarket: Validate market → Derive API key   │
│              → Sign order (EIP-712) → Submit to CLOB     │
│                                                          │
│  Runs on Chainlink DON with consensus aggregation        │
└─────────────────────────────────────────────────────────┘
         │                     │
         ▼                     ▼
   Kalshi Trade API      Polymarket CLOB
   (elections.kalshi.com) (clob.polymarket.com)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| **Kalshi Backend** | Express.js, TypeScript, Axios |
| **Proxy Server** | Cloudflare Workers, Hono framework |
| **CRE Workflow** | Chainlink CRE SDK, TypeScript, Viem |
| **Crypto** | EIP-712 signing, HMAC-SHA256, secp256k1 |
| **AI Agent** | External AI API with markdown rendering (React Markdown) |
| **Package Manager** | npm (frontend/backend), Bun (CRE workflow) |

---

## Chainlink CRE Workflow

The `place-bet` CRE Workflow is the core on-chain component. It integrates **blockchain signing** with **external prediction market APIs**, running on the Chainlink Decentralized Oracle Network (DON) with consensus-based aggregation.

### Workflow Execution Flow

1. **HTTP Trigger** — The workflow is triggered via an HTTP request containing platform, market ID, and order parameters
2. **Platform Routing** — Routes to Kalshi or Polymarket handler based on input
3. **Kalshi Path**:
   - Constructs a limit order with authenticated headers (KALSHI-ACCESS-KEY, SIGNATURE, TIMESTAMP)
   - Submits to Kalshi Trade API v2
4. **Polymarket Path**:
   - Validates the market is open and the CLOB token ID exists
   - Retrieves the private key from CRE Secrets
   - Derives/creates API credentials via L1 authentication (EIP-712 signature)
   - Builds a signed order with proper rounding, salt generation, and EIP-712 domain separation
   - Submits the order to Polymarket's CLOB with HMAC-authenticated headers
5. **Consensus** — All HTTP calls use `consensusIdenticalAggregation()` ensuring DON nodes reach agreement

### Simulating the Workflow

```bash
cd cre/place-bet
bun install
cre simulate --target staging-settings --input test-p.json   # Polymarket
cre simulate --target staging-settings --input test-k.json   # Kalshi
```

---

## Files Using Chainlink

All Chainlink CRE integration files are located in the [`cre/place-bet/`](cre/place-bet/) directory:

| File | Description |
|---|---|
| [`cre/place-bet/main.ts`](cre/place-bet/main.ts) | Workflow entry point — HTTP trigger handler, platform routing, order orchestration using `@chainlink/cre-sdk` |
| [`cre/place-bet/lib/polymarket.lib.ts`](cre/place-bet/lib/polymarket.lib.ts) | Market validation via CRE `HTTPSendRequester` — checks if market is open and CLOB token exists |
| [`cre/place-bet/lib/polymarket-order.lib.ts`](cre/place-bet/lib/polymarket-order.lib.ts) | API key derivation (L1 auth) and order placement with EIP-712 signing via CRE HTTP client |
| [`cre/place-bet/lib/kalshi-order.lib.ts`](cre/place-bet/lib/kalshi-order.lib.ts) | Kalshi order placement via CRE `HTTPSendRequester` with authenticated headers |
| [`cre/place-bet/workflow.yaml`](cre/place-bet/workflow.yaml) | CRE workflow settings — defines staging and production targets, paths to config and secrets |
| [`cre/place-bet/config.staging.json`](cre/place-bet/config.staging.json) | Staging environment configuration |
| [`cre/place-bet/config.production.json`](cre/place-bet/config.production.json) | Production environment configuration |
| [`cre/place-bet/package.json`](cre/place-bet/package.json) | Dependencies including `@chainlink/cre-sdk`, `viem`, `@noble/secp256k1` |

---

## Project Structure

```
convergence-prediction-markets/
├── frontend/                        # Next.js 16 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── app/                 # Main app pages
│   │   │   │   ├── markets/         # Markets dashboard & detail pages
│   │   │   │   └── agent-markets/   # AI agent marketplace view
│   │   │   └── api/                 # Next.js API routes
│   │   │       ├── markets/         # Kalshi market proxying
│   │   │       ├── polymarket/      # Polymarket API proxying
│   │   │       ├── orders/          # Order management
│   │   │       ├── ai/              # AI chat & model endpoints
│   │   │       └── trades/          # Trade history
│   │   ├── components/
│   │   │   ├── app/                 # App components (MarketsTable, AI Analysis, etc.)
│   │   │   └── landing/             # Landing page components
│   │   ├── lib/api/                 # API client libraries
│   │   └── types/                   # TypeScript type definitions
│   └── public/                      # Static assets
│
├── backend/
│   ├── kalshi/                      # Kalshi integration server (Express + TS)
│   │   └── src/
│   │       ├── server.ts            # Express server entry
│   │       ├── routes/              # REST endpoints (markets, orders, events, trades)
│   │       └── services/            # Kalshi API client & auth (HMAC-SHA256)
│   ├── proxy-server/                # CORS proxy (Cloudflare Workers + Hono)
│   │   └── src/index.ts             # Domain-allowlisted proxy for Polymarket
│   └── polymarket/                  # Polymarket helper utilities
│
├── cre/                             # Chainlink CRE Workflows
│   ├── place-bet/                   # Order execution workflow
│   │   ├── main.ts                  # Workflow entry point
│   │   ├── lib/                     # Platform-specific order logic
│   │   ├── workflow.yaml            # CRE workflow configuration
│   │   └── config.*.json            # Environment configs
│   └── secrets.yaml                 # CRE secrets (gitignored)
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **Bun** (for CRE workflow)
- **CRE CLI** (`npm install -g @chainlink/cre-cli`)
- Kalshi API credentials
- Polymarket wallet private key

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/convergence-prediction-markets.git
cd convergence-prediction-markets

# Frontend
cd frontend && npm install && cd ..

# Kalshi Backend
cd backend/kalshi && npm install && cd ../..

# Proxy Server
cd backend/proxy-server && npm install && cd ../..

# CRE Workflow
cd cre/place-bet && bun install && cd ../..
```

### Environment Variables

Create `.env` files in the respective directories:

**`backend/kalshi/.env`**
```env
KALSHI_API_KEY=your_kalshi_api_key
KALSHI_PRIVATE_KEY_PATH=path_to_your_kalshi_private_key
PORT=3001
```

**`cre/secrets.yaml`**
```yaml
PRIVATE_KEY: "your_polymarket_wallet_private_key"
```

### Running the Application

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Kalshi Backend
cd backend/kalshi && npm run dev

# Terminal 3 — Proxy Server
cd backend/proxy-server && npm run dev

# Terminal 4 — CRE Workflow Simulation
cd cre/place-bet && cre simulate --target staging-settings --input test-p.json
```

---

## Demo Video

[Link to demo video]

---

## License

MIT
