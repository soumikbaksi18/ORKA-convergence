const features = [
  {
    title: "Autonomous Trading Bots",
    description:
      "Deploy bots that monitor markets 24/7, execute strategies, and report PnL in real-time. Paper or live mode.",
    icon: "⬆",
  },
  {
    title: "Quant Analysis Engine",
    description:
      "Run pandas, numpy, and custom scripts directly. Chart generation, statistical modeling, and backtesting built-in.",
    icon: "▤",
  },
  {
    title: "One-Click Execution",
    description:
      "Trade across leading prediction platforms from a single order panel. Market and limit orders with risk management.",
    icon: "⚡",
  },
  {
    title: "Multi-Platform Scanner",
    description:
      "Real-time market scanner with filtering, sorting, and whale activity tracking across all supported prediction platforms.",
    icon: "☰",
  },
  {
    title: "AI Agent",
    description:
      "Natural language interface to your trading stack. Ask the AI to analyze markets, write strategies, and deploy bots for you.",
    icon: "›",
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "AES-256 encrypted credentials, isolated sandboxed execution, and zero-knowledge key management. Your keys stay yours.",
    icon: "🛡",
  },
];

export function Capabilities() {
  return (
    <section id="features" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Capabilities
        </p>
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Everything you need to win
        </h2>
        <p className="mb-16 max-w-2xl text-zinc-400">
          A unified AI terminal that combines market intelligence, autonomous
          execution and multi-platform trading.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.08)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-500/10 text-lg text-purple-300">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
