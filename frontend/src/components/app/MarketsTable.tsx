import Link from "next/link";
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
            const spread =
              m.yes_ask != null && m.yes_bid != null
                ? ((m.yes_ask - m.yes_bid) / 100) * 100
                : null;
            const expTime = m.expiration_time ?? m.close_time ?? "";
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
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {d != null ? `${d}d` : "—"} · {formatCents(m.yes_bid ?? 0)} Y{" "}
                        {formatCents(m.no_bid ?? 0)} N
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {formatCents(m.last_price ?? 0)}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {m.volume_24h != null ? formatCompact(m.volume_24h) : "$0"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {m.volume != null ? formatCompact(m.volume) : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {m.open_interest != null
                    ? formatCompact(m.open_interest)
                    : "—"}
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
                          width: `${m.last_price ?? 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-zinc-300">
                      {m.last_price != null ? `${m.last_price}%` : "—"}
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
