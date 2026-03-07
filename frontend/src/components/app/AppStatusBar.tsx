"use client";

import { useEffect, useState } from "react";
import { checkKalshiHealth } from "@/lib/api/kalshi";

export function AppStatusBar() {
  const [kalshiLatency, setKalshiLatency] = useState<number | null>(null);

  useEffect(() => {
    checkKalshiHealth().then(({ latencyMs }) => {
      if (latencyMs != null) setKalshiLatency(latencyMs);
    });
    const t = setInterval(() => {
      checkKalshiHealth().then(({ latencyMs }) => {
        if (latencyMs != null) setKalshiLatency(latencyMs);
      });
    }, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="flex h-9 items-center justify-between border-t border-white/10 bg-black px-4 text-xs text-zinc-500">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          ONLINE
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
        <span className="text-zinc-500">Polymarket —</span>
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
