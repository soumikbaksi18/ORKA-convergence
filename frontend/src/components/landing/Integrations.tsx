const platforms = [
  {
    name: "Polymarket",
    tag: "DEFI",
    description:
      "Crypto-native prediction markets with deep liquidity. Full CLOB trading, order books, and position management.",
  },
  {
    name: "Kalshi",
    tag: "REGULATED",
    description:
      "CFTC-regulated event contracts. Access 500+ markets with real-time pricing, series tracking, and order execution.",
  },
  {
    name: "Opinion",
    tag: "SOCIAL",
    description:
      "Social prediction markets with community insights. Categorical markets, leaderboards, and social trading signals.",
  },
];

export function Integrations() {
  return (
    <section id="platforms" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex items-center justify-center gap-4">
          <span className="text-6xl font-bold text-white/[0.04]">ETH/USD</span>
        </div>
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
          Integrations
        </p>
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          One terminal. Every market.
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-zinc-400">
          Trade and analyze across the leading prediction market platforms from
          a single interface.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-purple-500/30 hover:shadow-[0_0_24px_rgba(168,85,247,0.06)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {platform.name}
                </h3>
                <span className="rounded border border-white/20 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-400">
                  {platform.tag}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-zinc-400">
                {platform.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
