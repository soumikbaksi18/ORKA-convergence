"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MarketSourceTabs } from "@/components/app/MarketSourceTabs";
import { CategoryFilters } from "@/components/app/CategoryFilters";
import { MarketsTable } from "@/components/app/MarketsTable";
import { fetchMarkets } from "@/lib/api/kalshi";
import {
  fetchPolymarketEvents,
  polymarketEventsToMarkets,
} from "@/lib/api/polymarket";
import type { Market } from "@/types/markets";

type Source = "kalshi" | "polymarket" | "opinion" | "predict" | "probable";

/** Polymarket Gamma API tag_slug per category. No tag for Trending/New (sort-only). */
const POLYMARKET_CATEGORY_TO_TAG_SLUG: Record<string, string | undefined> = {
  Trending: undefined,
  New: undefined,
  Politics: "politics",
  Sports: "sports",
  Crypto: "crypto",
  Finance: "finance",
  Geopolitics: "geopolitics",
  Tech: "tech",
  Culture: "culture",
  Elections: "elections",
};

function getPolymarketTagSlugForCategory(category: string): string | undefined {
  return POLYMARKET_CATEGORY_TO_TAG_SLUG[category];
}

export default function MarketsPage() {
  const [source, setSource] = useState<Source>("polymarket");
  const [category, setCategory] = useState("Trending");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (source === "kalshi") {
        const res = await fetchMarkets({
          status: "open",
          limit: 50,
          mve_filter: "exclude",
        });
        setMarkets(res.data ?? []);
      } else if (source === "polymarket") {
        const order =
          category === "New"
            ? "start_date"
            : "volume_24hr";
        const tagSlug = getPolymarketTagSlugForCategory(category);
        const events = await fetchPolymarketEvents({
          limit: 50,
          offset: 0,
          active: true,
          order,
          ascending: false,
          ...(tagSlug != null && { tag_slug: tagSlug }),
        });
        const normalized = polymarketEventsToMarkets(events);
        setMarkets(normalized);
      } else {
        setMarkets([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load markets");
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, [source, category]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  return (
    <div className="flex flex-col p-6">
      {/* Page tab + breadcrumbs */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/app/markets"
            className="rounded-md border border-purple-500/50 bg-purple-500/10 px-3 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
          >
            Markets
          </Link>
          <button
            type="button"
            className="rounded border border-white/10 p-2 text-zinc-400 hover:text-white"
            aria-label="Add view"
          >
            +
          </button>
        </div>
        <p className="text-sm text-zinc-500">Home &gt; Markets</p>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-white">Browse Markets</h1>

      {/* Source tabs */}
      <div className="mb-6">
        <MarketSourceTabs value={source} onChange={setSource} />
      </div>

      {/* Search + filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-1 items-center rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400 min-w-[200px]">
          <svg
            className="mr-2 h-4 w-4 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Search {source === "kalshi" ? "Kalshi" : source} markets…
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded border p-2 ${
              viewMode === "list"
                ? "border-purple-500/50 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                : "border-white/10 text-zinc-400 hover:text-white"
            }`}
            aria-label="List view"
          >
            <ListIcon />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded border p-2 ${
              viewMode === "grid"
                ? "border-purple-500/50 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                : "border-white/10 text-zinc-400 hover:text-white"
            }`}
            aria-label="Grid view"
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={loadMarkets}
            className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white"
          >
            <RefreshIcon />
            Refresh
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:text-white"
          >
            <FilterIcon />
            Filters
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="mb-6">
        <CategoryFilters value={category} onChange={setCategory} />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          {source === "kalshi" &&
            ". Ensure the Kalshi integration server is running on port 4000."}
          {source === "polymarket" &&
            " Ensure the proxy allows gamma-api.polymarket.com or try again."}
        </div>
      )}

      {/* List or grid (blocks) view — 3 cards per row on large screens */}
      <MarketsTable
        markets={markets}
        isLoading={loading}
        viewMode={viewMode}
      />
    </div>
  );
}

function ListIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM2 9a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V9zM2 14a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}
