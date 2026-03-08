"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchMarket,
  fetchEvent,
  fetchOrderbook,
  fetchTrades,
  type OrderbookLevel,
  getYesBid,
  getYesAsk,
  getNoBid,
  getNoAsk,
  getLastPrice,
  getVolume,
  getOpenInterest,
  getMarketTitle,
  getMarketOptionLabel,
  getExpiration,
} from "@/lib/api/kalshi";
import type { Market, KalshiEvent } from "@/types/markets";

/* ────────────────────────────── helpers ────────────────────────────── */

function formatCents(c: number) {
  return `${c}\u00A2`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "\u2014";
  }
}

/* ────────────────────────────── PriceChart ─────────────────────────── */

function getDemoChartData(market: Market): { yes_price: number; created_time: string }[] {
  const current = getLastPrice(market) || getYesAsk(market) || getYesBid(market) || 50;
  const base = Math.max(0, Math.min(100, current - 15));
  const now = new Date();
  const points = 30;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const yes_price = Math.round(base + (current - base) * Math.pow(t, 0.7) + Math.sin(i * 0.5) * 2);
    return {
      yes_price: Math.max(0, Math.min(100, yes_price)),
      created_time: new Date(now.getTime() - (points - 1 - i) * 3600000).toISOString(),
    };
  });
}

function PriceChart({
  trades,
  isDemo,
}: {
  trades: { yes_price: number; created_time: string }[];
  isDemo?: boolean;
}) {
  if (trades.length === 0) return null;

  const padL = 40;
  const padR = 50;
  const padT = 10;
  const padB = 4;
  const W = 600;
  const H = 200;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const prices = trades.map((t) => t.yes_price);
  const lastP = prices[prices.length - 1] ?? 50;

  const yLevels = [0, 25, 50, 75, 100];

  const toX = (i: number) => padL + (i / Math.max(trades.length - 1, 1)) * chartW;
  const toY = (p: number) => padT + chartH - (p / 100) * chartH;

  const linePts = trades.map((t, i) => `${toX(i)},${toY(t.yes_price)}`);
  const lineD = `M ${linePts.join(" L ")}`;

  // Area fill: line path + close to bottom-right and bottom-left
  const areaD = `${lineD} L ${toX(trades.length - 1)},${toY(0)} L ${toX(0)},${toY(0)} Z`;

  return (
    <div className="relative w-full">
      {isDemo && (
        <span className="absolute right-2 top-2 z-10 rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
          Demo
        </span>
      )}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {yLevels.map((lvl) => (
          <g key={lvl}>
            <line
              x1={padL}
              x2={W - padR}
              y1={toY(lvl)}
              y2={toY(lvl)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text
              x={padL - 6}
              y={toY(lvl) + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.3)"
              fontSize="10"
            >
              {lvl}%
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#chartGrad)" />

        {/* Line */}
        <path d={lineD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />

        {/* End dot */}
        <circle cx={toX(trades.length - 1)} cy={toY(lastP)} r="4" fill="#10b981" />

        {/* End price label */}
        <rect
          x={toX(trades.length - 1) + 8}
          y={toY(lastP) - 10}
          width="36"
          height="20"
          rx="4"
          fill="#10b981"
        />
        <text
          x={toX(trades.length - 1) + 26}
          y={toY(lastP) + 4}
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="600"
        >
          {lastP}%
        </text>
      </svg>
    </div>
  );
}

/* ───────────────────────── Outcomes Table ──────────────────────────── */

function OutcomesTable({
  markets,
  currentTicker,
}: {
  markets: Market[];
  currentTicker: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_SHOW = 5;
  const sorted = [...markets].sort((a, b) => getLastPrice(b) - getLastPrice(a));
  const visible = expanded ? sorted : sorted.slice(0, INITIAL_SHOW);
  const remaining = sorted.length - INITIAL_SHOW;

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-zinc-500">
            <th className="pb-3 font-medium">Outcome</th>
            <th className="pb-3 text-center font-medium">Chance</th>
            <th className="pb-3 text-center font-medium">Yes</th>
            <th className="pb-3 text-center font-medium">No</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((m) => {
            const label = getMarketOptionLabel(m);
            const chance = getLastPrice(m);
            const yesAsk = getYesAsk(m);
            const noAsk = getNoAsk(m);
            const isCurrent = m.ticker === currentTicker;

            return (
              <tr
                key={m.ticker}
                className={`border-b border-white/5 ${isCurrent ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}`}
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/app/markets/${encodeURIComponent(m.ticker)}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-zinc-300">
                      {label.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-medium ${isCurrent ? "text-emerald-400" : "text-white"}`}>
                        {label}
                      </span>
                      {m.subtitle && (
                        <p className="text-xs text-zinc-500">{m.subtitle.replace(/^::\s*/, "")}</p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="py-3 text-center">
                  <span className="text-lg font-bold text-white">{chance}%</span>
                </td>
                <td className="py-3 text-center">
                  <Link
                    href={`/app/markets/${encodeURIComponent(m.ticker)}`}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    Yes {yesAsk > 0 ? formatCents(yesAsk) : ""}
                  </Link>
                </td>
                <td className="py-3 text-center">
                  <Link
                    href={`/app/markets/${encodeURIComponent(m.ticker)}`}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
                  >
                    No {noAsk > 0 ? formatCents(noAsk) : ""}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          {remaining} more
        </button>
      )}
    </div>
  );
}

/* ───────────────────────── Market Rules ────────────────────────────── */

function MarketRules({ market }: { market: Market }) {
  const [showFull, setShowFull] = useState(false);
  const primary = market.rules_primary;
  const secondary = market.rules_secondary;

  if (!primary && !secondary) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#141418] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Market Rules</h3>
      </div>

      {/* Outcome tab */}
      <div className="mb-4 inline-flex rounded-lg bg-white/5 p-1">
        <span className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
          {getMarketOptionLabel(market)}
        </span>
      </div>

      {primary && (
        <p className="mb-4 text-sm leading-relaxed text-zinc-300">{primary}</p>
      )}

      {secondary && (
        <>
          {showFull && (
            <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {secondary}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowFull(!showFull)}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-white"
          >
            {showFull ? "Hide full rules" : "View full rules"}
            <span className="text-xs">{showFull ? "\u25B2" : "\u25BC"}</span>
          </button>
        </>
      )}

      {/* Timeline and payout */}
      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Timeline and payout</span>
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        {market.expected_expiration_time && (
          <span>Expected: {formatDate(market.expected_expiration_time as string)}</span>
        )}
        {market.early_close_condition && (
          <p className="mt-1 text-zinc-600">{market.early_close_condition}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Trading Sidebar ─────────────────────────────── */

function TradingSidebar({
  market,
  eventTitle,
  siblingMarkets,
}: {
  market: Market;
  eventTitle: string;
  siblingMarkets: Market[];
}) {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [selectedTicker, setSelectedTicker] = useState(market.ticker);

  const selected = siblingMarkets.find((m) => m.ticker === selectedTicker) ?? market;
  const yesPrice = tab === "buy" ? getYesAsk(selected) : getYesBid(selected);
  const noPrice = tab === "buy" ? getNoAsk(selected) : getNoBid(selected);

  return (
    <div className="sticky top-6 rounded-xl border border-white/10 bg-[#141418]">
      {/* Title */}
      <div className="border-b border-white/10 p-5">
        <h3 className="text-sm font-semibold text-white leading-snug">
          {eventTitle}
        </h3>
      </div>

      <div className="p-5">
        {/* Buy / Sell tabs */}
        <div className="mb-4 flex rounded-lg bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setTab("buy")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tab === "buy"
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setTab("sell")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
              tab === "sell"
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Outcome selector */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-zinc-500">Outcome</label>
          {siblingMarkets.length > 1 ? (
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              title="Select outcome"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
            >
              {siblingMarkets.map((m) => (
                <option key={m.ticker} value={m.ticker} className="bg-zinc-900">
                  {getMarketOptionLabel(m)}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white">
              {getMarketOptionLabel(market)}
            </div>
          )}
        </div>

        {/* Prices */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs text-zinc-500">Yes</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">
              {yesPrice > 0 ? formatCents(yesPrice) : "\u2014"}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xs text-zinc-500">No</p>
            <p className="mt-1 text-lg font-bold text-red-400">
              {noPrice > 0 ? formatCents(noPrice) : "\u2014"}
            </p>
          </div>
        </div>

        {/* No contracts message */}
        <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
          <p className="text-sm text-zinc-400">No contracts available now</p>
        </div>

        <button
          type="button"
          className="w-full text-center text-sm text-emerald-400 hover:text-emerald-300"
        >
          Place a limit order instead
        </button>

        {/* Auth notice */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-500">
          <span className="mt-0.5">&#9889;</span>
          <p>Configure Kalshi API credentials to enable live trading.</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Orderbook ──────────────────────────────── */

function getDemoOrderbook(market: Market): OrderbookLevel {
  const yesBid = getYesBid(market);
  const noBid = getNoBid(market);
  const yesLevels: [number, number][] = [
    [yesBid, 100], [Math.max(0, yesBid - 1), 50], [Math.max(0, yesBid - 2), 25],
    [Math.max(0, yesBid - 5), 10], [Math.max(0, yesBid - 10), 5],
  ].filter(([p]) => p > 0) as [number, number][];
  const noLevels: [number, number][] = [
    [noBid, 100], [Math.min(100, noBid + 1), 50], [Math.min(100, noBid + 2), 25],
    [Math.min(100, noBid + 5), 10], [Math.min(100, noBid + 10), 5],
  ].filter(([p]) => p <= 100) as [number, number][];
  return { yes: yesLevels, no: noLevels };
}

function OrderbookDisplay({
  orderbook,
  market,
  isDemo,
}: {
  orderbook: OrderbookLevel | null;
  market: Market;
  isDemo?: boolean;
}) {
  const hasLevels = (orderbook?.yes?.length ?? 0) > 0 || (orderbook?.no?.length ?? 0) > 0;
  const displayOb = hasLevels ? orderbook! : getDemoOrderbook(market);
  const yesDisplay = (displayOb.yes ?? []).slice().reverse().slice(0, 8);
  const noDisplay = (displayOb.no ?? []).slice().reverse().slice(0, 8);
  return (
    <div className="relative rounded-xl border border-white/10 bg-[#141418] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Order Book</h3>
        {isDemo && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-500">Demo</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="mb-2 flex justify-between text-zinc-500">
            <span>Price</span><span>Qty</span>
          </div>
          <div className="space-y-1">
            {yesDisplay.map(([price, qty], i) => (
              <div key={i} className="flex justify-between rounded px-2 py-1 text-emerald-400" style={{ background: `rgba(16,185,129,${Math.min(qty / 200, 0.15)})` }}>
                <span>{formatCents(price)}</span><span>{qty}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-zinc-500">
            <span>Qty</span><span>Price</span>
          </div>
          <div className="space-y-1">
            {noDisplay.map(([price, qty], i) => (
              <div key={i} className="flex justify-between rounded px-2 py-1 text-red-400" style={{ background: `rgba(239,68,68,${Math.min(qty / 200, 0.15)})` }}>
                <span>{qty}</span><span>{formatCents(price)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ PAGE ═══════════════════════════════════ */

export default function MarketPage() {
  const params = useParams();
  const ticker = params?.ticker as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [siblingMarkets, setSiblingMarkets] = useState<Market[]>([]);
  const [eventData, setEventData] = useState<KalshiEvent | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookLevel | null>(null);
  const [trades, setTrades] = useState<{ yes_price: number; created_time: string }[]>([]);
  const [dataApiAvailable, setDataApiAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("ALL");

  // Fetch market + event
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetchMarket(ticker);
        const m = res.data;
        if (cancelled) return;
        setMarket(m);
        if (m?.event_ticker) {
          try {
            const eventRes = await fetchEvent(m.event_ticker);
            if (cancelled) return;
            setEventData(eventRes.data ?? null);
            setSiblingMarkets(eventRes.markets ?? []);
          } catch {
            setSiblingMarkets([]);
          }
        } else {
          setSiblingMarkets([]);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load market");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ticker]);

  // Fetch orderbook + trades
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setDataApiAvailable(null);
    (async () => {
      try {
        const [obRes, trRes] = await Promise.all([
          fetchOrderbook(ticker).catch(() => ({ success: false, data: null })),
          fetchTrades({ ticker, limit: 100 }).catch(() => ({ success: false, data: [] })),
        ]);
        if (cancelled) return;
        const obOk = obRes.success && obRes.data != null;
        const trOk = trRes.success && Array.isArray(trRes.data);
        setDataApiAvailable(obOk || trOk);
        if (obOk && obRes.data) setOrderbook(obRes.data);
        else setOrderbook(null);
        if (trOk && trRes.data)
          setTrades(
            trRes.data
              .map((t: { yes_price: number; created_time: string }) => ({
                yes_price: t.yes_price,
                created_time: t.created_time,
              }))
              .reverse()
          );
        else setTrades([]);
      } catch {
        if (!cancelled) {
          setDataApiAvailable(false);
          setOrderbook(null);
          setTrades([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [ticker]);

  /* ── Loading / Error states ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          <span>Loading market...</span>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          {error || "Market not found"}
        </div>
        <Link href="/app/markets" className="mt-4 inline-block text-emerald-400 hover:underline">
          &larr; Back to Markets
        </Link>
      </div>
    );
  }

  /* ── Derived values ── */
  const eventTitle = eventData?.title || getMarketTitle(market);
  const category = eventData?.category || "";
  const subTitle = eventData?.sub_title || "";
  const lastPrice = getLastPrice(market);
  const vol = getVolume(market);
  const oi = getOpenInterest(market);
  const expTime = getExpiration(market);

  // Aggregate volume across all sibling markets
  const totalVol = siblingMarkets.length > 0
    ? siblingMarkets.reduce((sum, m) => sum + getVolume(m), 0)
    : vol;

  // Top outcomes sorted by price
  const topOutcomes = [...siblingMarkets]
    .sort((a, b) => getLastPrice(b) - getLastPrice(a))
    .slice(0, 4);

  return (
    <div className="flex flex-col p-4 md:p-6">
      {/* ── Breadcrumb ── */}
      <nav className="mb-5 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/app/markets" className="hover:text-white">
          Markets
        </Link>
        {category && (
          <>
            <span>&gt;</span>
            <span className="text-zinc-400">{category}</span>
          </>
        )}
        {subTitle && (
          <>
            <span>&gt;</span>
            <span className="text-zinc-400">{subTitle}</span>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ════════════ LEFT COLUMN ════════════ */}
        <div className="flex flex-col gap-6">
          {/* ── Header ── */}
          <div>
            <h1 className="mb-3 text-2xl font-bold leading-tight text-white md:text-3xl">
              {eventTitle}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
              <span className="font-medium text-white">${formatCompact(totalVol)} Vol.</span>
              {siblingMarkets.length > 1 && (
                <span>{siblingMarkets.length} outcomes</span>
              )}
              {expTime && <span>{formatDate(expTime)}</span>}
              {/* Top outcome pills */}
              {topOutcomes.map((m) => (
                <span
                  key={m.ticker}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs"
                >
                  {getMarketOptionLabel(m)} {getLastPrice(m)}%
                </span>
              ))}
            </div>
          </div>

          {dataApiAvailable === false && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <strong>Chart & order book unavailable.</strong> Start the Kalshi backend:{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">cd backend/kalshi && npm run dev</code>
            </div>
          )}

          {/* ── Price Chart ── */}
          <div className="rounded-xl border border-white/10 bg-[#141418] p-5">
            <div className="mb-1 flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-white">{lastPrice}%</span>
                <span className="ml-2 text-sm text-zinc-500">chance</span>
              </div>
            </div>

            <div className="my-4 h-[200px]">
              <PriceChart
                trades={trades.length > 0 ? trades : getDemoChartData(market)}
                isDemo={trades.length === 0}
              />
            </div>

            {/* Time range buttons */}
            <div className="flex gap-1 border-t border-white/10 pt-3">
              {["1D", "1W", "1M", "3M", "ALL"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeRange(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    timeRange === t
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Outcomes Table ── */}
          {siblingMarkets.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#141418] p-5">
              <OutcomesTable markets={siblingMarkets} currentTicker={ticker} />
            </div>
          )}

          {/* ── Market Rules ── */}
          <MarketRules market={market} />

          {/* ── Order Book ── */}
          <OrderbookDisplay
            orderbook={orderbook}
            market={market}
            isDemo={!(orderbook?.yes?.length || orderbook?.no?.length)}
          />

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Volume", value: `$${formatCompact(vol)}` },
              { label: "Open Interest", value: formatCompact(oi) },
              { label: "Status", value: (market.status as string) ?? "active" },
              { label: "Expires", value: expTime ? formatDate(expTime) : "\u2014" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-[#141418] p-4">
                <p className="text-xs text-zinc-500">{s.label}</p>
                <p className="mt-1 text-sm font-semibold text-white capitalize">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ RIGHT SIDEBAR ════════════ */}
        <div className="order-first lg:order-last">
          <TradingSidebar
            market={market}
            eventTitle={eventTitle}
            siblingMarkets={siblingMarkets.length > 0 ? siblingMarkets : [market]}
          />
        </div>
      </div>
    </div>
  );
}
