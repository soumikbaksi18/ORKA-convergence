"use client";

type Source = "kalshi" | "polymarket" | "opinion" | "predict" | "probable";

const SOURCES: { id: Source; label: string }[] = [
  { id: "kalshi", label: "Kalshi" },
  { id: "polymarket", label: "Polymarket" },
  { id: "opinion", label: "Opinion" },
  { id: "predict", label: "Predict" },
  { id: "probable", label: "Probable" },
];

interface MarketSourceTabsProps {
  value: Source;
  onChange: (source: Source) => void;
}

export function MarketSourceTabs({ value, onChange }: MarketSourceTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {SOURCES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
            value === s.id
              ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
