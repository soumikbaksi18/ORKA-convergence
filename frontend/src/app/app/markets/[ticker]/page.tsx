"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchMarket, fetchEvent, fetchOrderbook, fetchTrades, type OrderbookLevel } from "@/lib/api/kalshi";
import type { Market } from "@/types/markets";

function formatCents(c: number) {
  return `${c}¢`;
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
    return "—";
  }
}

/** Generate demo chart data from current market price when there are no trades */
function getDemoChartData(market: Market): { yes_price: number; created_time: string }[] {
  const current = market.last_price ?? market.yes_ask ?? market.yes_bid ?? 50;
  const base = Math.max(0, Math.min(100, current - 15));
  const now = new Date();
  const points = 24;
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const yes_price = Math.round(base + (current - base) * Math.pow(t, 0.7) + (Math.sin(i * 0.5) * 2));
    return {
      yes_price: Math.max(0, Math.min(100, yes_price)),
      created_time: new Date(now.getTime() - (points - 1 - i) * 3600000).toISOString(),
    };
  });
}

function PriceChart({ trades, isDemo }: { trades: { yes_price: number; created_time: string }[]; isDemo?: boolean }) {
  if (trades.length === 0) return null;
  const prices = trades.map((t) => t.yes_price);
  const minP = Math.min(...prices, 0);
  const maxP = Math.max(...prices, 100);
  const range = maxP - minP || 1;
  const w = 400;
  const h = 120;
  const pts = trades.map((t, i) => {
    const x = (i / Math.max(trades.length - 1, 1)) * w;
    const y = h - ((t.yes_price - minP) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const pathD = pts.length > 1 ? `M ${pts.join(" L ")}` : `M 0,${h / 2}`;
  return (
    <div className="relative h-full w-full">
      {isDemo && (
        <span className="absolute right-2 top-2 rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
          Demo
        </span>
      )}
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="text-emerald-500">
        <path d={pathD} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Generate demo orderbook levels when API returns empty */
function getDemoOrderbook(market: Market): OrderbookLevel {
  const yesBid = market.yes_bid ?? 30;
  const noBid = market.no_bid ?? 30;
  const yesLevels: [number, number][] = [
    [yesBid, 100],
    [Math.max(0, yesBid - 1), 50],
    [Math.max(0, yesBid - 2), 25],
    [Math.max(0, yesBid - 5), 10],
    [Math.max(0, yesBid - 10), 5],
    [Math.max(0, yesBid - 15), 1],
  ].filter(([p]) => p > 0) as [number, number][];
  const noLevels: [number, number][] = [
    [noBid, 100],
    [Math.min(100, noBid + 1), 50],
    [Math.min(100, noBid + 2), 25],
    [Math.min(100, noBid + 5), 10],
    [Math.min(100, noBid + 10), 5],
    [Math.min(100, noBid + 15), 1],
  ].filter(([p]) => p <= 100) as [number, number][];
  return { yes: yesLevels, no: noLevels };
}

function OrderbookDisplay({
  orderbook,
  market,
  formatCents,
  isDemo,
}: {
  orderbook: OrderbookLevel | null;
  market: Market;
  formatCents: (c: number) => string;
  isDemo?: boolean;
}) {
  const yesLevels = orderbook?.yes ?? [];
  const noLevels = orderbook?.no ?? [];
  const hasLevels = yesLevels.length > 0 || noLevels.length > 0;
  const displayOb = hasLevels ? orderbook! : getDemoOrderbook(market);
  const yesDisplay = (displayOb.yes ?? []).slice().reverse().slice(0, 10);
  const noDisplay = (displayOb.no ?? []).slice().reverse().slice(0, 10);
  return (
    <div className="relative">
      {isDemo && (
        <span className="absolute -top-1 right-0 rounded bg-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
          Demo
        </span>
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 text-emerald-500">YES BIDS</p>
          <div className="space-y-1 text-zinc-400">
            {yesDisplay.length > 0
              ? yesDisplay.map(([price, qty], i) => (
                  <div key={i} className="flex justify-between">
                    <span>{formatCents(price)}</span>
                    <span>{qty}</span>
                  </div>
                ))
              : (
                <div className="flex justify-between">
                  <span>{formatCents(market.yes_bid ?? 0)}</span>
                  <span>—</span>
                </div>
              )}
          </div>
        </div>
        <div>
          <p className="mb-2 text-red-500">NO BIDS</p>
          <div className="space-y-1 text-zinc-400">
            {noDisplay.length > 0
              ? noDisplay.map(([price, qty], i) => (
                  <div key={i} className="flex justify-between">
                    <span>{qty}</span>
                    <span>{formatCents(price)}</span>
                  </div>
                ))
              : (
                <div className="flex justify-between">
                  <span>—</span>
                  <span>{formatCents(market.no_bid ?? 0)}</span>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketPage() {
  const params = useParams();
  const ticker = params?.ticker as string;
  const [market, setMarket] = useState<Market | null>(null);
  const [siblingMarkets, setSiblingMarkets] = useState<Market[]>([]);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookLevel | null>(null);
  const [trades, setTrades] = useState<{ yes_price: number; created_time: string }[]>([]);
  const [dataApiAvailable, setDataApiAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setEventTitle(eventRes.data?.title ?? null);
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

  // Fetch orderbook and trades when market is loaded
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
          setTrades(trRes.data.map((t) => ({ yes_price: t.yes_price, created_time: t.created_time })).reverse());
        else setTrades([]);
      } catch {
        if (!cancelled) setDataApiAvailable(false);
        if (!cancelled) setOrderbook(null);
        if (!cancelled) setTrades([]);
      }
    })();
    return () => { cancelled = true; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-zinc-400">
        Loading market…
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="p-6">
        <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400">
          {error || "Market not found"}
        </div>
        <Link href="/app/markets" className="mt-4 inline-block text-purple-400 hover:underline">
          ← Back to Markets
        </Link>
      </div>
    );
  }

  const spread =
    market.yes_ask != null && market.yes_bid != null
      ? market.yes_ask - market.yes_bid
      : null;
  const expTime = market.expiration_time ?? market.close_time ?? "";
  const vol = market.volume ?? 0;
  const oi = market.open_interest ?? 0;

  return (
    <div className="flex flex-col p-6">
      {/* Tab + breadcrumbs */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="max-w-[180px] truncate rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            {market.title.length > 20 ? `${market.title.slice(0, 20)}…` : market.title}
          </span>
          <button
            type="button"
            className="rounded border border-white/10 p-2 text-zinc-400 hover:text-white"
            aria-label="New tab"
          >
            +
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          Home &gt; Markets &gt; {market.title}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left + center */}
        <div className="flex flex-col gap-6">
          {/* Market overview */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <p className="mb-2 font-mono text-xs text-zinc-500">{market.ticker}</p>
            <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
              {eventTitle ?? market.title}
              <span className="text-zinc-500">ℹ️</span>
            </h1>
            <div className="mb-4 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span>${formatCompact(vol)}</span>
              {siblingMarkets.length > 0 && (
                <span>{siblingMarkets.length} markets</span>
              )}
              {expTime && <span>{formatDate(expTime)}</span>}
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <span className="text-emerald-400">BUY YES {formatCents(market.yes_ask ?? 0)}</span>
              <span className="text-red-400">BUY NO {formatCents(market.no_ask ?? 0)}</span>
              <span className="text-emerald-400">SELL YES {formatCents(market.yes_bid ?? 0)}</span>
              <span className="text-red-400">SELL NO {formatCents(market.no_bid ?? 0)}</span>
            </div>
          </div>

          {dataApiAvailable === false && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <strong>Chart & order book unavailable.</strong> Restart the Kalshi integration server so it loads the orderbook and trades routes:{" "}
              <code className="rounded bg-black/30 px-1 py-0.5">cd backend/kalshi-integration && npm run dev</code>
            </div>
          )}

          {/* Contract question + tags */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h2 className="mb-3 text-lg font-semibold text-white">{market.title}</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded border border-white/20 px-2 py-0.5 text-xs text-zinc-400">
                Kalshi
              </span>
              {spread != null && (
                <span className="rounded border border-white/20 px-2 py-0.5 text-xs text-zinc-400">
                  Spread {formatCents(spread)}
                </span>
              )}
              <span className="rounded border border-white/20 px-2 py-0.5 text-xs text-zinc-400">
                Vol ${formatCompact(vol)}
              </span>
            </div>
            {/* Price chart from trades */}
            <div className="mb-4 flex gap-2">
              {["1H", "1D", "1W", "1M", "1Y", "ALL"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded px-2 py-1 text-xs ${t === "1D" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="h-48 rounded bg-white/5 overflow-hidden">
              <PriceChart
                trades={trades.length > 0 ? trades : getDemoChartData(market)}
                isDemo={trades.length === 0}
              />
            </div>
          </div>

          {/* Sibling markets (outcomes) or single */}
          {siblingMarkets.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-medium uppercase text-zinc-500">
                  Outcomes
                </p>
                <ul className="space-y-2">
                  {siblingMarkets.map((m) => (
                    <li key={m.ticker}>
                      <Link
                        href={`/app/markets/${encodeURIComponent(m.ticker)}`}
                        className={`block truncate rounded px-2 py-1.5 text-sm ${
                          m.ticker === market.ticker
                            ? "bg-purple-600/30 text-purple-300"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {m.title.length > 22 ? `${m.title.slice(0, 22)}…` : m.title}
                      </Link>
                      <span className="ml-2 text-xs text-zinc-500">
                        {formatCents(m.last_price ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <p className="mb-3 text-xs font-medium uppercase text-zinc-500">
                  Orderbook
                </p>
                <OrderbookDisplay
                  orderbook={orderbook}
                  market={market}
                  formatCents={formatCents}
                  isDemo={!(orderbook?.yes?.length || orderbook?.no?.length)}
                />
              </div>
            </div>
          )}

          {siblingMarkets.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-3 text-xs font-medium uppercase text-zinc-500">
                Orderbook
              </p>
              <OrderbookDisplay
                orderbook={orderbook}
                market={market}
                formatCents={formatCents}
                isDemo={!(orderbook?.yes?.length || orderbook?.no?.length)}
              />
            </div>
          )}
        </div>

        {/* Right: Quick Trade */}
        <div className="h-fit rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <h3 className="mb-4 text-sm font-medium uppercase text-zinc-500">
            Quick Trade
          </h3>
          <p className="mb-4 truncate text-sm text-zinc-300">
            {market.title}
          </p>
          <p className="mb-2 text-xs text-zinc-500">
            Status: <span className="text-emerald-400">{market.status ?? "active"}</span>
          </p>
          <p className="mb-4 text-xs text-zinc-500">
            OI: {formatCompact(oi)}
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="w-full rounded-lg bg-emerald-600/80 py-3 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Buy YES @ {formatCents(market.yes_ask ?? 0)}
            </button>
            <button
              type="button"
              className="w-full rounded-lg bg-red-600/80 py-3 text-sm font-medium text-white hover:bg-red-600"
            >
              Buy NO @ {formatCents(market.no_ask ?? 0)}
            </button>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded border border-white/10 bg-white/5 p-3 text-xs text-zinc-500">
            <span>⚡</span>
            <p>
              Configure Kalshi API credentials in environment variables to enable trading.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
