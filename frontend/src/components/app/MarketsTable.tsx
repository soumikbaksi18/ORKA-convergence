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

interface MarketsTableProps {
  markets: Market[];
  isLoading?: boolean;
}

export function MarketsTable({ markets, isLoading }: MarketsTableProps) {
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
                    href={`/app/markets/${encodeURIComponent(m.ticker)}`}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 h-9 w-9 shrink-0 rounded bg-white/10" />
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
