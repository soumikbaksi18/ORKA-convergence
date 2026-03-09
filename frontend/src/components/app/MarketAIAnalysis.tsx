"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getMarketOptionLabel, getLastPrice } from "@/lib/api/kalshi";
import type { Market } from "@/types/markets";

/** Only allow https URLs for links and images. */
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url, "https://dummy");
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function ChatMessageBody({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null;
  if (isUser) {
    return <p className="mt-0.5 whitespace-pre-wrap break-words">{content}</p>;
  }
  return (
    <div className="mt-0.5 [&_p]:my-1 [&_ul]:my-2 [&_li]:my-0.5 [&_a]:text-emerald-400 [&_a]:no-underline hover:[&_a]:underline [&_a]:break-all">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            if (!href || !isSafeUrl(href)) return <span {...props}>{children}</span>;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          img: ({ src, alt, ...props }) => {
            if (!src || !isSafeUrl(src)) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt ?? ""}
                className="my-2 max-w-full rounded-lg border border-white/10"
                loading="lazy"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const API_BASE = typeof window === "undefined" ? "" : "";

interface AIModel {
  id: string;
  name: string;
  provider: string;
}

type DataSourceId = "x" | "reddit" | "instagram" | "finance";

const DATA_SOURCE_OPTIONS: {
  id: DataSourceId;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  addLabel: string;
  placeholder: string;
}[] = [
  { id: "x", name: "X (Twitter)", Icon: IconX, addLabel: "Add source account", placeholder: "@elonmusk" },
  { id: "reddit", name: "Reddit", Icon: IconReddit, addLabel: "Add source channel", placeholder: "r/wallstreetbets" },
  { id: "instagram", name: "Instagram", Icon: IconInstagram, addLabel: "Add source account", placeholder: "@username" },
  { id: "finance", name: "Finance / Markets", Icon: IconFinance, addLabel: "Add symbol or market", placeholder: "BTC-USD, SPY" },
];

function getSourceLink(id: DataSourceId, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const clean = v.replace(/^@/, "").replace(/^r\//, "");
  switch (id) {
    case "x":
      return `https://x.com/${clean}`;
    case "reddit":
      return `https://reddit.com/${v.startsWith("r/") ? v : `r/${clean}`}`;
    case "instagram":
      return `https://instagram.com/${clean}`;
    case "finance":
      return `https://www.google.com/search?q=${encodeURIComponent(v)}+price`;
    default:
      return null;
  }
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconReddit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.248-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484 1.105 3.467 1.105s2.625-.263 3.467-1.105a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.746.746-2.04.977-3.032.977s-2.286-.23-3.032-.977a.326.326 0 0 0-.464 0z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}

interface MarketContext {
  event_title: string;
  outcomes: { label: string; ticker: string; last_price: number | null }[];
}

export function MarketAIAnalysis({
  eventTitle,
  siblingMarkets,
}: {
  eventTitle: string;
  siblingMarkets: Market[];
}) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [modelId, setModelId] = useState<string>("openai");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<string>("medium");
  const [amountUsd, setAmountUsd] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [addedSources, setAddedSources] = useState<{ id: DataSourceId; value: string }[]>([]);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [pendingSource, setPendingSource] = useState<typeof DATA_SOURCE_OPTIONS[number] | null>(null);
  const [pendingValue, setPendingValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dataSourceDropdownRef = useRef<HTMLDivElement>(null);
  const pendingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!addSourceOpen) return;
    const close = (e: MouseEvent) => {
      if (dataSourceDropdownRef.current && !dataSourceDropdownRef.current.contains(e.target as Node)) {
        setAddSourceOpen(false);
        setPendingSource(null);
        setPendingValue("");
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [addSourceOpen]);

  useEffect(() => {
    if (pendingSource) pendingInputRef.current?.focus();
  }, [pendingSource]);

  const openAddSource = (opt: typeof DATA_SOURCE_OPTIONS[number]) => {
    setPendingSource(opt);
    setPendingValue("");
    setAddSourceOpen(false);
  };

  const confirmAddSource = () => {
    const value = pendingValue.trim();
    if (!pendingSource || !value) return;
    setAddedSources((prev) => [...prev, { id: pendingSource.id, value }]);
    setPendingSource(null);
    setPendingValue("");
  };

  const removeDataSource = (index: number) => {
    setAddedSources((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/ai/models`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.models)) setModels(data.models);
        if (data?.models?.length && !modelId) setModelId(data.models[0].id);
      })
      .catch(() => {})
      .finally(() => setModelsLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const marketContext: MarketContext = {
    event_title: eventTitle,
    outcomes: siblingMarkets.slice(0, 20).map((m) => ({
      label: getMarketOptionLabel(m),
      ticker: m.ticker,
      last_price: getLastPrice(m) || null,
    })),
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelId,
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          market: marketContext,
          risk_tolerance: riskTolerance,
          amount_usd: amountUsd ? parseFloat(amountUsd) : undefined,
          data_sources: addedSources.map((s) => {
            const opt = DATA_SOURCE_OPTIONS.find((o) => o.id === s.id);
            return { source: opt?.name ?? s.id, value: s.value, link: getSourceLink(s.id, s.value) };
          }),
        }),
      });
      const data = await res.json();
      const reply = data?.reply ?? (data?.error || "Sorry, I couldn’t get a response.");
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Is the AI backend running? (cd backend/ai && uvicorn main:app --reload)" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f12] shadow-xl">
      <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          AI Analysis
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Get market summaries, sentiment (X, Reddit, etc.), and risk-aware suggestions.
        </p>
      </div>

      <div className="flex flex-col p-4">
        {/* Model + Risk + Amount */}
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Model
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={modelsLoading}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40 disabled:opacity-60"
            >
              {models.length
                ? models.map((m) => (
                    <option key={m.id} value={m.id} className="bg-zinc-900">
                      {m.name}
                    </option>
                  ))
                : (
                    <option value="openai" className="bg-zinc-900">OpenAI (GPT-4o)</option>
                  )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Risk tolerance
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40"
              >
                <option value="low" className="bg-zinc-900">Low</option>
                <option value="medium" className="bg-zinc-900">Medium</option>
                <option value="high" className="bg-zinc-900">High</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Optional"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>
        </div>

        {/* Integrate data sources */}
        <div className="mb-4" ref={dataSourceDropdownRef}>
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Integrate data sources
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddSourceOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-sm text-zinc-400 outline-none transition-colors focus:border-emerald-500/40 hover:border-white/20"
            >
              <span>Add data source</span>
              <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={addSourceOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            {addSourceOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border border-white/10 bg-[#18181b] py-1 shadow-xl">
                {DATA_SOURCE_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => openAddSource(opt)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-zinc-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inline add: account / channel / symbol */}
          {pendingSource && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <label className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/90">
                {pendingSource.addLabel}
              </label>
              <div className="flex gap-2">
                <input
                  ref={pendingInputRef}
                  type="text"
                  value={pendingValue}
                  onChange={(e) => setPendingValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmAddSource()}
                  placeholder={pendingSource.placeholder}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/40"
                />
                <button
                  type="button"
                  onClick={confirmAddSource}
                  disabled={!pendingValue.trim()}
                  className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {addedSources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {addedSources.map((source, index) => {
                const opt = DATA_SOURCE_OPTIONS.find((o) => o.id === source.id);
                if (!opt) return null;
                const { Icon, name } = opt;
                const link = getSourceLink(source.id, source.value);
                const displayValue = source.value.trim() || name;
                return (
                  <div
                    key={`${source.id}-${index}-${source.value}`}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] pl-2 pr-1 py-1.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs text-zinc-300">{name}</span>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[120px] truncate text-xs text-emerald-400 hover:underline"
                        title={source.value}
                      >
                        {displayValue}
                      </a>
                    ) : (
                      <span className="max-w-[120px] truncate text-xs text-zinc-400">{displayValue}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDataSource(index)}
                      className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
                      aria-label={`Remove ${name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex min-h-[280px] flex-1 flex-col rounded-xl border border-white/10 bg-black/20">
          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && (
              <p className="rounded-lg bg-white/[0.04] p-3 text-zinc-500">
                Ask for a market summary, social sentiment (X, Reddit, Instagram), or outcome suggestions. Include your risk and amount above for better advice.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "ml-4 bg-emerald-500/15 text-emerald-100"
                    : "mr-4 bg-white/[0.06] text-zinc-200"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase text-zinc-500">
                  {m.role === "user" ? "You" : "AI"}
                </span>
                <ChatMessageBody content={m.content} isUser={m.role === "user"} />
              </div>
            ))}
            {loading && (
              <div className="mr-4 rounded-lg bg-white/[0.06] px-3 py-2 text-zinc-500">
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t border-white/10 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask for summary, sentiment, or suggestions…"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/40"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
