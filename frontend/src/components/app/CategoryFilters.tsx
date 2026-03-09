"use client";

const CATEGORIES = [
  "Trending",
  "New",
  "Politics",
  "Sports",
  "Crypto",
  "Finance",
  "Geopolitics",
  "Tech",
  "Culture",
  "Elections",
];

interface CategoryFiltersProps {
  value: string;
  onChange: (category: string) => void;
}

export function CategoryFilters({ value, onChange }: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
            value === cat
              ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              : "border border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
