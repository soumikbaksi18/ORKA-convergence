"use client";

import { useState } from "react";
import Link from "next/link";
import type { Market } from "@/types/markets";
import {
  getYesBid,
  getYesAsk,
  getNoBid,
  getLastPrice,
  getVolume,
  getVolume24h,
  getOpenInterest,
  getMarketTitle,
  getExpiration,
} from "@/lib/api/kalshi";

function MarketThumbnail({
  imageUrl,
  title,
}: {
  imageUrl?: string | null;
  title: string;
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
    <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded bg-white/10">
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
        <div
          className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500"
          title={title}
        >
          {title.charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}

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

function daysLeft(iso: string): number | null {
  try {
    const exp = new Date(iso).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((exp - now) / (24 * 60 * 60 * 1000)));
  } catch {
    return null;
  }
}

function MarketCard({ market: m }: { market: Market }) {
  const [directFailed, setDirectFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);
  const useProxy = directFailed && !!m.image_url;
  const proxySrc = useProxy
    ? `/api/image-proxy?url=${encodeURIComponent(m.image_url!)}`
    : null;
  const showDirect = m.image_url && !directFailed;
  const showProxy = useProxy && proxySrc && !proxyFailed;
  const showImage = showDirect || showProxy;
  const src = showProxy ? proxySrc : m.image_url ?? null;

  const yesBid = getYesBid(m);
  const noBid = getNoBid(m);
  const lastPrice = getLastPrice(m);
  const vol = getVolume(m);
  const vol24h = getVolume24h(m);
  const oi = getOpenInterest(m);
  const title = getMarketTitle(m);
  const expTime = getExpiration(m);
  const d = expTime ? daysLeft(expTime) : null;

  const href =
    m.ticker.startsWith("poly-") && m.event_ticker
      ? `/app/markets/${encodeURIComponent(m.ticker)}?event=${encodeURIComponent((m.event_ticker || "").replace(/^poly-/, ""))}`
      : `/app/markets/${encodeURIComponent(m.ticker)}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-purple-500/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]"
    >
      {/* Card image */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-white/5">
        {showImage && src ? (
          <img
            key={src}
            src={src}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            onError={() => {
              if (showProxy) setProxyFailed(true);
              else setDirectFailed(true);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-zinc-600" title={title}>
            {title.charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-white group-hover:text-purple-200">
          {title}
        </h3>

        {/* Yes / No prices */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
          <span className="text-xs font-medium text-emerald-400">
            Yes {formatCents(yesBid)}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-xs font-medium text-rose-400">
            No {formatCents(noBid)}
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Volume</p>
            <p className="text-xs font-medium text-zinc-300">
              {vol > 0 ? `$${formatCompact(vol)}` : "$0"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Liquidity</p>
            <p className="text-xs font-medium text-zinc-300">
              {oi > 0 ? `$${formatCompact(oi)}` : "$0"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">24h Vol</p>
            <p className="text-xs font-medium text-zinc-300">
              {vol24h > 0 ? `$${formatCompact(vol24h)}` : "$0"}
            </p>
          </div>
        </div>

        {/* Time left + progress */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {d != null ? `${d}d left` : "—"}
          </span>
          <div className="flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-1.5 rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, lastPrice))}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs text-zinc-400">
            {lastPrice > 0 ? `${lastPrice}%` : "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}

interface MarketsTableProps {
  markets: Market[];
  isLoading?: boolean;
  viewMode?: "list" | "grid";
}

export function MarketsTable({ markets, isLoading, viewMode = "list" }: MarketsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center text-zinc-400">
        Loading markets…
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center text-zinc-400">
        No markets found. Try another source or category.
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {markets.map((m) => (
          <MarketCard key={m.ticker} market={m} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400">
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">24h Vol</th>
            <th className="px-4 py-3 font-medium">Total Vol</th>
            <th className="px-4 py-3 font-medium">Liquidity</th>
            <th className="px-4 py-3 font-medium">Spread</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Prob</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => {
            const yesBid = getYesBid(m);
            const yesAsk = getYesAsk(m);
            const noBid = getNoBid(m);
            const lastPrice = getLastPrice(m);
            const vol = getVolume(m);
            const vol24h = getVolume24h(m);
            const oi = getOpenInterest(m);
            const title = getMarketTitle(m);
            const expTime = getExpiration(m);

            const spread =
              yesAsk > 0 && yesBid > 0
                ? yesAsk - yesBid
                : null;
            const d = expTime ? daysLeft(expTime) : null;

            return (
              <tr
                key={m.ticker}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <Link
                    href={
                      m.ticker.startsWith("poly-") && m.event_ticker
                        ? `/app/markets/${encodeURIComponent(m.ticker)}?event=${encodeURIComponent((m.event_ticker || "").replace(/^poly-/, ""))}`
                        : `/app/markets/${encodeURIComponent(m.ticker)}`
                    }
                    className="flex items-start gap-3"
                  >
                    <MarketThumbnail imageUrl={m.image_url} title={title} />
                    <div>
                      <p className="font-medium text-white hover:text-purple-300">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {d != null ? `${d}d` : "—"} · {formatCents(yesBid)} Y{" "}
                        {formatCents(noBid)} N
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {formatCents(lastPrice)}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {vol24h > 0 ? formatCompact(vol24h) : "$0"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {vol > 0 ? formatCompact(vol) : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {oi > 0 ? formatCompact(oi) : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {spread != null ? `${spread.toFixed(2)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {expTime ? formatDate(expTime) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{
                          width: `${lastPrice}%`,
                        }}
                      />
                    </div>
                    <span className="text-zinc-300">
                      {lastPrice > 0 ? `${lastPrice}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
