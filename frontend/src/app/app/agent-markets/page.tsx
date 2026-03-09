"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Finance",
  "Sports",
  "Politics",
  "War",
  "Trending",
  "Cinema",
  "Movies",
  "Crypto",
  "Tech",
] as const;

interface LastProfit {
  amount: string;
  roi: string;
}

interface MarketResult {
  question: string;
  profit: string;
  roi: string;
}

interface AgentCardData {
  id: string;
  name: string;
  deployedBy: string;
  category: string;
  imageUrl: string; // representative image for the market/bet (e.g. politics → election, sports → FIFA)
  totalProfit: string;
  totalRoi: string;
  lastProfits: LastProfit[];
  markets: MarketResult[];
}

// Representative images per market theme (Finance → NVIDIA/stock, Sports → FIFA, Politics → election, etc.)
const MOCK_AGENTS: AgentCardData[] = [
  {
    id: "1",
    name: "NVIDIA Cap Alpha",
    deployedBy: "trading_alex",
    category: "Finance",
    imageUrl: "/images/faang.png",
    totalProfit: "+$2,450.00",
    totalRoi: "+34%",
    lastProfits: [
      { amount: "+$420", roi: "+28%" },
      { amount: "+$310", roi: "+19%" },
      { amount: "+$180", roi: "+12%" },
    ],
    markets: [
      { question: "Largest company by market cap end of March?", profit: "+$420", roi: "+28%" },
      { question: "Will Fed cut rates in May?", profit: "+$310", roi: "+19%" },
      { question: "S&P 500 above 6,000 by June?", profit: "+$180", roi: "+12%" },
    ],
  },
  {
    id: "2",
    name: "World Cup Predictor",
    deployedBy: "sports_fan_99",
    category: "Sports",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=240&fit=crop",
    totalProfit: "+$1,820.00",
    totalRoi: "+41%",
    lastProfits: [
      { amount: "+$550", roi: "+35%" },
      { amount: "+$390", roi: "+22%" },
      { amount: "+$280", roi: "+18%" },
    ],
    markets: [
      { question: "World Cup 2026 winner?", profit: "+$550", roi: "+35%" },
      { question: "Premier League top 4?", profit: "+$390", roi: "+22%" },
      { question: "Champions League winner?", profit: "+$280", roi: "+18%" },
    ],
  },
  {
    id: "3",
    name: "Election Signal Pro",
    deployedBy: "poli_quant",
    category: "Politics",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=240&fit=crop",
    totalProfit: "+$3,100.00",
    totalRoi: "+52%",
    lastProfits: [
      { amount: "+$720", roi: "+45%" },
      { amount: "+$480", roi: "+31%" },
      { amount: "+$350", roi: "+24%" },
    ],
    markets: [
      { question: "2028 Democratic nominee?", profit: "+$720", roi: "+45%" },
      { question: "Senate control 2026?", profit: "+$480", roi: "+31%" },
      { question: "UK next PM?", profit: "+$350", roi: "+24%" },
    ],
  },
  {
    id: "4",
    name: "Conflict Tracker MCP",
    deployedBy: "geo_agent",
    category: "War",
    imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&h=240&fit=crop",
    totalProfit: "+$890.00",
    totalRoi: "+18%",
    lastProfits: [
      { amount: "+$220", roi: "+14%" },
      { amount: "+$190", roi: "+11%" },
      { amount: "+$150", roi: "+9%" },
    ],
    markets: [
      { question: "Ceasefire by Q2 2025?", profit: "+$220", roi: "+14%" },
      { question: "Oil above $90 by June?", profit: "+$190", roi: "+11%" },
      { question: "NATO expansion event?", profit: "+$150", roi: "+9%" },
    ],
  },
  {
    id: "5",
    name: "Viral Trend Scout",
    deployedBy: "trend_hunter",
    category: "Trending",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=240&fit=crop",
    totalProfit: "+$1,650.00",
    totalRoi: "+38%",
    lastProfits: [
      { amount: "+$410", roi: "+26%" },
      { amount: "+$320", roi: "+20%" },
      { amount: "+$210", roi: "+15%" },
    ],
    markets: [
      { question: "Apple event product launch?", profit: "+$410", roi: "+26%" },
      { question: "Next viral AI model release?", profit: "+$320", roi: "+20%" },
      { question: "Mega merger announced?", profit: "+$210", roi: "+15%" },
    ],
  },
  {
    id: "6",
    name: "Oscar Night Bot",
    deployedBy: "cinema_bet",
    category: "Cinema",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=240&fit=crop",
    totalProfit: "+$1,120.00",
    totalRoi: "+29%",
    lastProfits: [
      { amount: "+$380", roi: "+23%" },
      { amount: "+$290", roi: "+18%" },
      { amount: "+$180", roi: "+12%" },
    ],
    markets: [
      { question: "Best Picture winner 2026?", profit: "+$380", roi: "+23%" },
      { question: "Box office #1 opening weekend?", profit: "+$290", roi: "+18%" },
      { question: "Streaming subscriber milestone?", profit: "+$180", roi: "+12%" },
    ],
  },
  {
    id: "7",
    name: "Blockbuster Predictor",
    deployedBy: "movie_maven",
    category: "Movies",
    imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=240&fit=crop",
    totalProfit: "+$980.00",
    totalRoi: "+25%",
    lastProfits: [
      { amount: "+$340", roi: "+21%" },
      { amount: "+$260", roi: "+16%" },
      { amount: "+$170", roi: "+10%" },
    ],
    markets: [
      { question: "Top grossing film 2025?", profit: "+$340", roi: "+21%" },
      { question: "Marvel Phase 6 first hit?", profit: "+$260", roi: "+16%" },
      { question: "Disney+ subs by year end?", profit: "+$170", roi: "+10%" },
    ],
  },
  {
    id: "8",
    name: "BTC Halving Alpha",
    deployedBy: "crypto_whale",
    category: "Crypto",
    imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=240&fit=crop",
    totalProfit: "+$2,780.00",
    totalRoi: "+48%",
    lastProfits: [
      { amount: "+$620", roi: "+32%" },
      { amount: "+$490", roi: "+28%" },
      { amount: "+$380", roi: "+22%" },
    ],
    markets: [
      { question: "BTC above $100k by Dec?", profit: "+$620", roi: "+32%" },
      { question: "ETH/BTC ratio by Q3?", profit: "+$490", roi: "+28%" },
      { question: "Solana TVL milestone?", profit: "+$380", roi: "+22%" },
    ],
  },
  {
    id: "9",
    name: "Tech Earnings Scout",
    deployedBy: "faang_trader",
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=240&fit=crop",
    totalProfit: "+$1,950.00",
    totalRoi: "+36%",
    lastProfits: [
      { amount: "+$440", roi: "+27%" },
      { amount: "+$360", roi: "+21%" },
      { amount: "+$250", roi: "+15%" },
    ],
    markets: [
      { question: "Apple revenue beat Q2?", profit: "+$440", roi: "+27%" },
      { question: "NVDA guidance raise?", profit: "+$360", roi: "+21%" },
      { question: "META daily active users?", profit: "+$250", roi: "+15%" },
    ],
  },
  {
    id: "10",
    name: "Macro Pulse",
    deployedBy: "macro_mind",
    category: "Finance",
    imageUrl: "/images/faang.png",
    totalProfit: "+$2,100.00",
    totalRoi: "+39%",
    lastProfits: [
      { amount: "+$520", roi: "+30%" },
      { amount: "+$390", roi: "+24%" },
      { amount: "+$280", roi: "+17%" },
    ],
    markets: [
      { question: "CPI print direction?", profit: "+$520", roi: "+30%" },
      { question: "10Y yield by month end?", profit: "+$390", roi: "+24%" },
      { question: "DXY above 106?", profit: "+$280", roi: "+17%" },
    ],
  },
  {
    id: "11",
    name: "Soccer Oracle",
    deployedBy: "footy_ai",
    category: "Sports",
    imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=240&fit=crop",
    totalProfit: "+$1,440.00",
    totalRoi: "+33%",
    lastProfits: [
      { amount: "+$380", roi: "+24%" },
      { amount: "+$310", roi: "+19%" },
      { amount: "+$220", roi: "+14%" },
    ],
    markets: [
      { question: "La Liga winner?", profit: "+$380", roi: "+24%" },
      { question: "Ballon d'Or 2025?", profit: "+$310", roi: "+19%" },
      { question: "Top scorer EPL?", profit: "+$220", roi: "+14%" },
    ],
  },
  {
    id: "12",
    name: "State Poll Aggregator",
    deployedBy: "election_ai",
    category: "Politics",
    imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=240&fit=crop",
    totalProfit: "+$2,330.00",
    totalRoi: "+44%",
    lastProfits: [
      { amount: "+$590", roi: "+36%" },
      { amount: "+$420", roi: "+27%" },
      { amount: "+$310", roi: "+20%" },
    ],
    markets: [
      { question: "Swing state outcome FL?", profit: "+$590", roi: "+36%" },
      { question: "Governor race TX?", profit: "+$420", roi: "+27%" },
      { question: "Prop 22 California?", profit: "+$310", roi: "+20%" },
    ],
  },
];

function AgentCard({ agent }: { agent: AgentCardData }) {
  const [imgError, setImgError] = useState(false);
  const needsProxy =
    agent.imageUrl.startsWith("https://images.unsplash.com") ||
    agent.imageUrl.startsWith("http://images.unsplash.com") ||
    agent.imageUrl.startsWith("https://upload.wikimedia.org") ||
    agent.imageUrl.startsWith("http://upload.wikimedia.org");
  const imgSrc = needsProxy
    ? `/api/image-proxy?url=${encodeURIComponent(agent.imageUrl)}`
    : agent.imageUrl;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-lg transition-colors hover:border-white/20">
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-white/5">
        {!imgError ? (
          /* Proxied so Unsplash etc. load reliably (no referrer/CORS issues) */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5 text-zinc-500">
            <span className="text-xs font-medium">{agent.category}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {agent.deployedBy}
          </p>
          <p className="text-[10px] text-zinc-500">Deployed by</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
          {agent.category}
        </span>
      </div>
      <h3 className="mb-4 text-lg font-semibold text-white">{agent.name}</h3>

      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
          Total profit
        </p>
        <p className="mt-0.5 text-xl font-bold text-emerald-400">
          {agent.totalProfit}
          <span className="ml-2 text-sm font-medium text-emerald-400/80">{agent.totalRoi}</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Last 3 profits
        </p>
        <ul className="space-y-1.5">
          {agent.lastProfits.map((p, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{p.amount}</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                {p.roi}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Prediction markets
        </p>
        <ul className="space-y-2">
          {agent.markets.map((m, i) => (
            <li key={i} className="flex flex-col gap-1">
              <p className="line-clamp-2 text-xs text-zinc-300">{m.question}</p>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="font-medium text-emerald-400">{m.profit}</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                  {m.roi} ROI
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
      >
        Copy agent
      </button>
      </div>
    </div>
  );
}

export default function AgentMarketsPage() {
  const [category, setCategory] = useState<string>("All");
  const filtered =
    category === "All"
      ? MOCK_AGENTS
      : MOCK_AGENTS.filter((a) => a.category.toLowerCase() === category.toLowerCase());

  return (
    <div className="flex flex-col p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/app/markets"
            className="rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Markets
          </Link>
          <Link
            href="/app/agent-markets"
            className="rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
          >
            Agent Markets
          </Link>
        </div>
        <p className="text-sm text-zinc-500">Home &gt; Agent Markets</p>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white">AI Agents Marketplace</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Deploy or copy AI agents with custom MCPs. Track profits and follow top performers.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? "border-purple-500/50 bg-purple-500/20 text-white"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
