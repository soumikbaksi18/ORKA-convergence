"use client";

import { useEffect, useState } from "react";
import { checkKalshiHealth } from "@/lib/api/kalshi";
import { checkPolymarketHealth } from "@/lib/api/polymarket";

export function AppStatusBar() {
  const [kalshiLatency, setKalshiLatency] = useState<number | null>(null);
  const [kalshiOnline, setKalshiOnline] = useState<boolean | null>(null);
  const [polyLatency, setPolyLatency] = useState<number | null>(null);
  const [polyOnline, setPolyOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const poll = () => {
      checkKalshiHealth().then(({ ok, latencyMs }) => {
        setKalshiOnline(ok);
        setKalshiLatency(latencyMs ?? null);
      });
      checkPolymarketHealth().then(({ ok, latencyMs }) => {
        setPolyOnline(ok);
        setPolyLatency(latencyMs ?? null);
      });
    };
    poll();
    const t = setInterval(poll, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="flex h-9 items-center justify-between border-t border-white/10 bg-black px-4 text-xs text-zinc-500">
      <div className="flex items-center gap-4">
        <span className={`flex items-center gap-1.5 ${kalshiOnline ? "text-emerald-500" : kalshiOnline === false ? "text-red-400" : "text-zinc-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${kalshiOnline ? "bg-emerald-500" : kalshiOnline === false ? "bg-red-400" : "bg-zinc-500"}`} />
          {kalshiOnline ? "ONLINE" : kalshiOnline === false ? "OFFLINE" : "..."}
        </span>
        <span
          className={
            kalshiLatency != null
              ? "text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              : "text-zinc-500"
          }
        >
          Kalshi {kalshiLatency != null ? `${kalshiLatency}ms` : "—"}
        </span>
        <span className={`flex items-center gap-1.5 ${polyOnline ? "text-emerald-500" : polyOnline === false ? "text-red-400" : "text-zinc-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${polyOnline ? "bg-emerald-500" : polyOnline === false ? "bg-red-400" : "bg-zinc-500"}`} />
          Polymarket {polyLatency != null ? `${polyLatency}ms` : "—"}
        </span>
        <span className="text-zinc-500">Opinion —</span>
      </div>
      <div className="hidden sm:block">MCP: 12/12 Tools</div>
      <div className="flex items-center gap-4">
        <span className="hidden md:inline">Model: GPT-4o</span>
        <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </footer>
  );
}
