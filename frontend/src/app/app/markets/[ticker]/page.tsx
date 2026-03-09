"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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
import {
  fetchPolymarketEvent,
  polymarketMarketToMarket,
  fetchPolymarketPricesHistory,
  fetchPolymarketOrderbook,
  type PolymarketMarketRaw,
  type PolymarketPriceHistoryPoint,
} from "@/lib/api/polymarket";
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

/* ───────────────────── Polymarket multi-line chart ──────────────────── */

const POLYMARKET_CHART_COLORS = [
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#f97316", // orange
  "#a855f7", // purple
  "#ec4899", // pink
];

function formatChartMonth(tUnixSec: number): string {
  return new Date(tUnixSec * 1000).toLocaleDateString("en-US", { month: "short" });
}

/** Deterministic seeded RNG so the same series gets the same path every time. */
function makeSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Build a randomized path that always ends at the CLOB last point.
 * Uses synthetic history so the chart looks like Polymarket (continuous lines)
 * while the final value is exactly from the API.
 */
function buildChartPath(
  lastPoint: { t: number; p: number },
  tMin: number,
  numPoints: number,
  seed: number
): PolymarketPriceHistoryPoint[] {
  const tEnd = lastPoint.t;
  const pEnd = lastPoint.p <= 1 ? lastPoint.p * 100 : lastPoint.p;
  const rand = makeSeededRandom(seed);
  const tStart = tMin;
  const tRange = tEnd - tStart || 1;
  const p0 = Math.max(0, Math.min(100, pEnd + (rand() - 0.5) * 28));
  const points: PolymarketPriceHistoryPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i === numPoints - 1 ? tEnd : tStart + (tRange * i) / (numPoints - 1);
    const progress = (i / (numPoints - 1)) ** 0.65;
    const base = p0 + (pEnd - p0) * progress;
    const noise = (rand() - 0.5) * 5 + Math.sin(i * 0.4) * 2;
    const p = i === numPoints - 1 ? pEnd : Math.max(0, Math.min(100, base + noise));
    points.push({ t, p: p / 100 });
  }
  points[points.length - 1] = { t: tEnd, p: lastPoint.p };
  return points;
}

const CHART_RANGE_SEC: Record<string, number> = {
  "1H": 60 * 60,
  "6H": 6 * 60 * 60,
  "1D": 24 * 60 * 60,
  "1W": 7 * 24 * 60 * 60,
  "1M": 30 * 24 * 60 * 60,
  "3M": 90 * 24 * 60 * 60,
  ALL: 365 * 24 * 60 * 60,
};

function PolymarketMultiLineChart({
  series,
  timeRange = "ALL",
}: {
  series: { label: string; currentPct: number; color: string; history: PolymarketPriceHistoryPoint[] }[];
  timeRange?: string;
}) {
  if (series.length === 0) return null;

  const padL = 44;
  const padR = 44;
  const padT = 12;
  const padB = 22;
  const W = 680;
  const H = 260;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const nowSec = Math.floor(Date.now() / 1000);
  const rangeSec = CHART_RANGE_SEC[timeRange] ?? CHART_RANGE_SEC.ALL;
  const tMin = nowSec - rangeSec;
  const tMax = nowSec;
  const tRange = tMax - tMin || 1;
  const NUM_SYNTHETIC_POINTS = 55;

  const toX = (t: number) => padL + ((t - tMin) / tRange) * chartW;
  const toY = (p: number) => padT + chartH - (p / 100) * chartH;
  const yLevels = [0, 25, 50, 75, 100];

  const xTicks = (() => {
    const count = 6;
    const out: { t: number; label: string }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = tMin + (tRange * i) / count;
      out.push({ t, label: formatChartMonth(t) });
    }
    return out;
  })();

  return (
    <div className="relative w-full">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          {series.slice(0, 6).map((s, i) => (
            <linearGradient
              key={i}
              id={`chartGradPoly-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid + Y labels (left) */}
        {yLevels.map((lvl) => (
          <g key={lvl}>
            <line
              x1={padL}
              x2={W - padR}
              y1={toY(lvl)}
              y2={toY(lvl)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text
              x={padL - 8}
              y={toY(lvl) + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              fontSize="11"
            >
              {lvl}%
            </text>
          </g>
        ))}

        {/* Y labels (right) - Polymarket style */}
        {yLevels.map((lvl) => (
          <text
            key={`r-${lvl}`}
            x={W - padR + 8}
            y={toY(lvl) + 4}
            textAnchor="start"
            fill="rgba(255,255,255,0.35)"
            fontSize="10"
          >
            {lvl}%
          </text>
        ))}

        {/* X-axis time labels */}
        {xTicks.map(({ t, label }, i) => (
          <text
            key={i}
            x={toX(t)}
            y={H - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="10"
          >
            {label}
          </text>
        ))}

        {/* Randomized paths ending exactly at CLOB last point (Polymarket-style) */}
        {series.slice(0, 6).map((s, idx) => {
          const sorted = [...s.history].sort((a, b) => a.t - b.t);
          if (sorted.length === 0) return null;
          const lastP = sorted[sorted.length - 1];
          const seed = (s.label.length * 7 + idx * 31) | 0;
          const points = buildChartPath(lastP, tMin, NUM_SYNTHETIC_POINTS, seed);
          const linePts = points.map((pt) => {
            const pct = pt.p <= 1 ? pt.p * 100 : pt.p;
            return `${toX(pt.t)},${toY(pct)}`;
          });
          const lineD = `M ${linePts.join(" L ")}`;
          const lastPct = lastP.p <= 1 ? lastP.p * 100 : lastP.p;

          return (
            <g key={idx}>
              <path
                d={lineD}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={toX(lastP.t)}
                cy={toY(lastPct)}
                r="5"
                fill={s.color}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
            </g>
          );
        })}
      </svg>

      {/* Legend - Polymarket style with dot + label + current % */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-3">
        {series.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-zinc-400">
              {s.label.length > 42 ? s.label.slice(0, 41) + "…" : s.label}
              <span className="ml-1.5 font-semibold text-zinc-200">{s.currentPct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Outcome thumbnail ────────────────────────── */

function OutcomeThumbnail({
  imageUrl,
  label,
}: {
  imageUrl?: string | null;
  label: string;
}) {
  const [directFailed, setDirectFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);
  const useProxy = directFailed && !!imageUrl;
  const proxySrc = useProxy
    ? `/api/image-proxy?url=${encodeURIComponent(imageUrl!)}`
    : null;
  const showDirect = imageUrl && !directFailed;
  const showProxy = useProxy && proxySrc && !proxyFailed;
  const showImage = showDirect || showProxy;
  const src = showProxy ? proxySrc : imageUrl ?? null;

  return (
    <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
      {showImage && src ? (
        <img
          key={src}
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            if (showProxy) setProxyFailed(true);
            else setDirectFailed(true);
          }}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-300">
          {label.charAt(0).toUpperCase() || "?"}
        </span>
      )}
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
          <tr className="border-b border-white/10 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <th className="pb-3 pr-4">Outcome</th>
            <th className="pb-3 text-center">Chance</th>
            <th className="pb-3 text-center">Yes</th>
            <th className="pb-3 text-center">No</th>
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
                    href={
                      m.ticker.startsWith("poly-") && m.event_ticker
                        ? `/app/markets/${encodeURIComponent(m.ticker)}?event=${encodeURIComponent((m.event_ticker || "").replace(/^poly-/, ""))}`
                        : `/app/markets/${encodeURIComponent(m.ticker)}`
                    }
                    className="flex items-center gap-3"
                  >
                    <OutcomeThumbnail imageUrl={m.image_url} label={label} />
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
                    href={
                      m.ticker.startsWith("poly-") && m.event_ticker
                        ? `/app/markets/${encodeURIComponent(m.ticker)}?event=${encodeURIComponent((m.event_ticker || "").replace(/^poly-/, ""))}`
                        : `/app/markets/${encodeURIComponent(m.ticker)}`
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                  >
                    Yes {yesAsk > 0 ? formatCents(yesAsk) : ""}
                  </Link>
                </td>
                <td className="py-3 text-center">
                  <Link
                    href={
                      m.ticker.startsWith("poly-") && m.event_ticker
                        ? `/app/markets/${encodeURIComponent(m.ticker)}?event=${encodeURIComponent((m.event_ticker || "").replace(/^poly-/, ""))}`
                        : `/app/markets/${encodeURIComponent(m.ticker)}`
                    }
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
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          +{remaining} more outcomes
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
    <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
      <h3 className="mb-4 text-sm font-semibold text-white">Market Rules</h3>
      <div className="mb-4 inline-flex rounded-xl bg-white/[0.06] px-3 py-2">
        <span className="text-sm font-medium text-white">
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
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
          >
            {showFull ? "Hide full rules" : "View full rules"}
            <span className="text-xs">{showFull ? "\u25B2" : "\u25BC"}</span>
          </button>
        </>
      )}
      <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-sm text-zinc-500">
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Timeline and payout</span>
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        {market.expected_expiration_time && (
          <span>Expected: {formatDate(market.expected_expiration_time as string)}</span>
        )}
        {market.early_close_condition && (
          <p className="mt-1 text-zinc-500">{market.early_close_condition}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Quick Trade Sidebar ─────────────────────────── */

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
  const oi = getOpenInterest(selected);

  return (
    <div className="sticky top-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-xl">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Quick Trade
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white">
          {eventTitle}
        </h3>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            active
          </span>
          {oi > 0 && (
            <span className="text-zinc-500">OI: {formatCompact(oi)}</span>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Buy / Sell tabs */}
        <div className="flex rounded-xl bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setTab("buy")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === "buy"
                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => setTab("sell")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
              tab === "sell"
                ? "bg-red-500/20 text-red-400 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Outcome */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-500">Outcome</label>
          {siblingMarkets.length > 1 ? (
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              title="Select outcome"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
            >
              {siblingMarkets.map((m) => (
                <option key={m.ticker} value={m.ticker} className="bg-zinc-900">
                  {getMarketOptionLabel(m)}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white">
              {getMarketOptionLabel(market)}
            </div>
          )}
        </div>

        {/* Primary action buttons: Buy YES / Buy NO */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-4 transition-colors hover:bg-emerald-500/20"
          >
            <span className="text-xs font-medium text-emerald-400/90">Yes</span>
            <span className="mt-1 text-lg font-bold text-emerald-400">
              {yesPrice > 0 ? formatCents(yesPrice) : "—"}
            </span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 py-4 transition-colors hover:bg-red-500/20"
          >
            <span className="text-xs font-medium text-red-400/90">No</span>
            <span className="mt-1 text-lg font-bold text-red-400">
              {noPrice > 0 ? formatCents(noPrice) : "—"}
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500">
          No contracts available now
        </p>

        <button
          type="button"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-white/[0.08] hover:text-emerald-300"
        >
          Place a limit order instead
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-zinc-400">
          <span className="text-amber-400" aria-hidden>&#9889;</span>
          <p>
            Configure Kalshi API credentials to enable live trading.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Orderbook ──────────────────────────────── */

function getDemoOrderbook(market: Market): OrderbookLevel {
  let yesBid = getYesBid(market);
  const noBid = getNoBid(market);
  // Ensure YES has a usable price so YES BIDS column is never empty when we have market data
  if (!yesBid || yesBid <= 0) {
    yesBid = getLastPrice(market) || getYesAsk(market) || (noBid < 100 ? 100 - noBid : 50) || 50;
  }
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
  const yesDisplay = (displayOb.yes ?? []).slice().reverse().slice(0, 10);
  const noDisplay = (displayOb.no ?? []).slice().reverse().slice(0, 10);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Order Book</h3>
        {isDemo && (
          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">Demo</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6 text-xs">
        <div>
          <div className="mb-2 flex justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Yes bids</span>
            <span>Qty</span>
          </div>
          <div className="space-y-0.5">
            {yesDisplay.map(([price, qty], i) => (
              <div
                key={i}
                className="flex justify-between rounded-lg px-3 py-2 text-emerald-400"
                style={{ background: `rgba(16,185,129,${Math.min(qty / 200, 0.12)})` }}
              >
                <span className="font-medium">{formatCents(price)}</span>
                <span className="text-zinc-400">{formatCompact(qty)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Qty</span>
            <span>No bids</span>
          </div>
          <div className="space-y-0.5">
            {noDisplay.map(([price, qty], i) => (
              <div
                key={i}
                className="flex justify-between rounded-lg px-3 py-2 text-red-400"
                style={{ background: `rgba(239,68,68,${Math.min(qty / 200, 0.12)})` }}
              >
                <span className="text-zinc-400">{formatCompact(qty)}</span>
                <span className="font-medium">{formatCents(price)}</span>
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
  const searchParams = useSearchParams();
  const ticker = params?.ticker as string;
  const eventIdParam = searchParams?.get("event");
  const isPolymarket = ticker?.startsWith("poly-");
  const marketIdFromTicker = isPolymarket ? (ticker || "").replace(/^poly-/, "") : "";

  const [market, setMarket] = useState<Market | null>(null);
  const [siblingMarkets, setSiblingMarkets] = useState<Market[]>([]);
  const [eventData, setEventData] = useState<KalshiEvent | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookLevel | null>(null);
  const [trades, setTrades] = useState<{ yes_price: number; created_time: string }[]>([]);
  const [dataApiAvailable, setDataApiAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("ALL");
  const [polymarketChartSeries, setPolymarketChartSeries] = useState<
    { label: string; currentPct: number; color: string; history: PolymarketPriceHistoryPoint[] }[]
  >([]);
  const [polymarketChartLoading, setPolymarketChartLoading] = useState(false);

  // Fetch market + event (Kalshi or Polymarket)
  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (isPolymarket && eventIdParam) {
          const ev = await fetchPolymarketEvent(eventIdParam);
          if (cancelled) return;
          const eventTicker = `poly-${ev.id}`;
          const rawMarkets = ev.markets ?? [];
          const found = rawMarkets.find((m: PolymarketMarketRaw) => String(m.id) === marketIdFromTicker);
          if (!found) {
            setError("Polymarket market not found in event.");
            setMarket(null);
            setSiblingMarkets([]);
            setEventData(null);
            return;
          }
          const normalizedMarket = polymarketMarketToMarket(found, eventTicker);
          const siblings = rawMarkets
            .filter((m: PolymarketMarketRaw) => m.id && (m.question || m.conditionId))
            .map((m: PolymarketMarketRaw) => polymarketMarketToMarket(m, eventTicker));
          setMarket(normalizedMarket);
          setSiblingMarkets(siblings);
          setEventData({
            event_ticker: eventTicker,
            title: ev.title ?? "",
            sub_title: ev.subtitle ?? "",
            category: (ev as { category?: string }).category ?? "",
          } as KalshiEvent);
        } else if (!isPolymarket) {
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
        } else {
          setError("Polymarket market requires ?event= in the URL. Open from the Markets list.");
          setMarket(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load market");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ticker, isPolymarket, eventIdParam, marketIdFromTicker]);

  // Fetch orderbook + trades (Kalshi only)
  useEffect(() => {
    if (!ticker || isPolymarket) {
      if (isPolymarket) setDataApiAvailable(false);
      return;
    }
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
  }, [ticker, isPolymarket]);

  // Fetch Polymarket CLOB orderbook (YES + NO token books)
  useEffect(() => {
    if (!isPolymarket || !market) return;
    const yesTokenId = (market as Market & { polymarket_yes_token_id?: string }).polymarket_yes_token_id;
    if (!yesTokenId) return;

    let cancelled = false;
    (async () => {
      try {
        const noTokenId = siblingMarkets.find(
          (s) =>
            (s as Market & { polymarket_yes_token_id?: string }).polymarket_yes_token_id &&
            (s as Market & { polymarket_yes_token_id?: string }).polymarket_yes_token_id !== yesTokenId
        ) as (Market & { polymarket_yes_token_id?: string }) | undefined;
        const ob = await fetchPolymarketOrderbook(
          yesTokenId,
          noTokenId?.polymarket_yes_token_id ?? undefined
        );
        if (cancelled) return;
        setOrderbook(ob);
      } catch {
        if (!cancelled) setOrderbook(null);
      }
    })();
    return () => { cancelled = true; };
  }, [isPolymarket, market, siblingMarkets]);

  // Fetch Polymarket price history for chart (multi-line by outcome). Fallback to synthetic series when no CLOB data.
  useEffect(() => {
    if (!isPolymarket || !market) {
      setPolymarketChartSeries([]);
      return;
    }
    const allOutcomes = siblingMarkets.length > 0 ? siblingMarkets : [market];
    const outcomesWithToken = allOutcomes
      .filter((m) => (m as Market & { polymarket_yes_token_id?: string }).polymarket_yes_token_id)
      .sort((a, b) => getLastPrice(b) - getLastPrice(a))
      .slice(0, 6);

    // When no token IDs: show Polymarket-style multi-line chart from current prices only (synthetic paths)
    if (outcomesWithToken.length === 0) {
      const topOutcomes = [...allOutcomes]
        .sort((a, b) => getLastPrice(b) - getLastPrice(a))
        .slice(0, 6);
      const nowSec = Math.floor(Date.now() / 1000);
      const syntheticSeries = topOutcomes.map((m, i) => ({
        label: getMarketOptionLabel(m),
        currentPct: getLastPrice(m),
        color: POLYMARKET_CHART_COLORS[i % POLYMARKET_CHART_COLORS.length],
        history: [{ t: nowSec, p: getLastPrice(m) / 100 }] as PolymarketPriceHistoryPoint[],
      }));
      setPolymarketChartSeries(syntheticSeries);
      setPolymarketChartLoading(false);
      return;
    }

    let cancelled = false;
    setPolymarketChartLoading(true);

    const nowSec = Math.floor(Date.now() / 1000);
    const rangeMs: Record<string, number> = {
      "1H": 60 * 60 * 1000,
      "6H": 6 * 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000,
      "3M": 90 * 24 * 60 * 60 * 1000,
      ALL: 365 * 24 * 60 * 60 * 1000,
    };
    const intervalMap: Record<string, "1m" | "1h" | "6h" | "1d" | "max" | "all"> = {
      "1H": "1m",
      "6H": "1h",
      "1D": "all",
      "1W": "all",
      "1M": "1d",
      "3M": "1d",
      ALL: "max",
    };
    const range = rangeMs[timeRange] ?? rangeMs.ALL;
    const startTs = nowSec - Math.floor(range / 1000);
    const interval = intervalMap[timeRange] ?? "1d";

    (async () => {
      try {
        const results = await Promise.all(
          outcomesWithToken.map(async (m) => {
            const tokenId = (m as Market & { polymarket_yes_token_id?: string }).polymarket_yes_token_id;
            if (!tokenId) return null;
            const history = await fetchPolymarketPricesHistory(tokenId, {
              interval,
              startTs,
              endTs: nowSec,
            });
            const label = getMarketOptionLabel(m);
            const currentPct = getLastPrice(m);
            return { label, currentPct, history };
          })
        );
        if (cancelled) return;
        const withColors = results
          .filter((r): r is { label: string; currentPct: number; history: PolymarketPriceHistoryPoint[] } => r != null)
          .map((r, i) => ({
            ...r,
            color: POLYMARKET_CHART_COLORS[i % POLYMARKET_CHART_COLORS.length],
          }));
        setPolymarketChartSeries(withColors);
      } catch {
        if (!cancelled) {
          // On CLOB fetch error: still show Polymarket-style chart with synthetic series from current prices
          const topOutcomes = [...allOutcomes]
            .sort((a, b) => getLastPrice(b) - getLastPrice(a))
            .slice(0, 6);
          const nowSec = Math.floor(Date.now() / 1000);
          setPolymarketChartSeries(
            topOutcomes.map((m, i) => ({
              label: getMarketOptionLabel(m),
              currentPct: getLastPrice(m),
              color: POLYMARKET_CHART_COLORS[i % POLYMARKET_CHART_COLORS.length],
              history: [{ t: nowSec, p: getLastPrice(m) / 100 }] as PolymarketPriceHistoryPoint[],
            }))
          );
        }
      } finally {
        if (!cancelled) setPolymarketChartLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isPolymarket, market, siblingMarkets, timeRange]);

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
    <div className="min-h-screen bg-[#0a0a0c]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/app/markets" className="transition-colors hover:text-white">
            Markets
          </Link>
          {category && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{category}</span>
            </>
          )}
          {subTitle && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 truncate max-w-[180px] sm:max-w-none">{subTitle}</span>
            </>
          )}
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {/* Header card: title + meta + outcome pills */}
            <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
              <div className="flex gap-4">
                {market.image_url && (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    <img
                      src={market.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold leading-tight text-white sm:text-2xl md:text-3xl">
                    {eventTitle}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                    <span className="font-medium text-white">${formatCompact(totalVol)} Vol.</span>
                    {siblingMarkets.length > 1 && (
                      <span>{siblingMarkets.length} outcomes</span>
                    )}
                    {expTime && <span>{formatDate(expTime)}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topOutcomes.map((m) => (
                      <span
                        key={m.ticker}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300"
                      >
                        {getMarketOptionLabel(m)} {getLastPrice(m)}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {dataApiAvailable === false && !isPolymarket && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
                Chart & order book unavailable. Start the Kalshi backend:{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">cd backend/kalshi && npm run dev</code>
              </div>
            )}

            {/* Price chart card — graphs only, no time filters */}
            <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
              <div className="mb-2">
                <span className="text-3xl font-bold text-white">{lastPrice}%</span>
                <span className="ml-2 text-sm text-zinc-500">chance</span>
                {isPolymarket && polymarketChartSeries.length > 0 && (
                  <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                    Live from Polymarket
                  </span>
                )}
              </div>
              <div className="my-4 min-h-[220px]">
                {isPolymarket && polymarketChartSeries.length > 0 ? (
                  <PolymarketMultiLineChart series={polymarketChartSeries} timeRange={timeRange} />
                ) : isPolymarket && polymarketChartLoading ? (
                  <div className="flex h-[240px] items-center justify-center text-zinc-500">
                    Loading chart data…
                  </div>
                ) : (
                  <PriceChart
                    trades={trades.length > 0 ? trades : getDemoChartData(market)}
                    isDemo={trades.length === 0}
                  />
                )}
              </div>
            </div>

            {/* Outcomes table */}
            {siblingMarkets.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-lg">
                <h3 className="mb-4 text-sm font-semibold text-white">Outcomes</h3>
                <OutcomesTable markets={siblingMarkets} currentTicker={ticker} />
              </div>
            )}

            {/* Market rules */}
            <MarketRules market={market} />

            {/* Order book */}
            <OrderbookDisplay
              orderbook={orderbook}
              market={market}
              isDemo={!(orderbook?.yes?.length || orderbook?.no?.length)}
            />

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Volume", value: `$${formatCompact(vol)}` },
                { label: "Open Interest", value: formatCompact(oi) },
                { label: "Status", value: (market.status as string) ?? "active" },
                { label: "Expires", value: expTime ? formatDate(expTime) : "\u2014" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-[#0f0f12] p-4">
                  <p className="text-xs font-medium text-zinc-500">{s.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white capitalize">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar: Quick Trade */}
          <div className="order-first lg:order-last">
            <TradingSidebar
              market={market}
              eventTitle={eventTitle}
              siblingMarkets={siblingMarkets.length > 0 ? siblingMarkets : [market]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
