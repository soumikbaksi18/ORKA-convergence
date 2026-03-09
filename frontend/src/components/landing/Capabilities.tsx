const features = [
  {
    title: "MCP Server Discovery",
    description:
      "Browse and connect MCP servers built for prediction markets. One protocol, every tool—from market data and order execution to custom analytics and agents.",
    icon: "⬆",
  },
  {
    title: "Agent-Ready Market Data",
    description:
      "Structured feeds and APIs your AI agents can consume via MCP. Real-time odds, orderbooks, and events across Polymarket, Kalshi, and more.",
    icon: "▤",
  },
  {
    title: "One-Click Execution",
    description:
      "Trade from any MCP-enabled client. Market and limit orders, risk controls, and unified execution across prediction platforms from a single panel.",
    icon: "⚡",
  },
  {
    title: "Multi-Platform Scanner",
    description:
      "Scan and filter markets across all connected platforms. Track whale activity, momentum, and opportunities through one MCP-powered scanner.",
    icon: "☰",
  },
  {
    title: "AI Agent",
    description:
      "Natural language interface to the MCP marketplace. Ask the AI to analyze markets, call MCP tools, place trades, and deploy strategies for you.",
    icon: "›",
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Secure MCP connections with encrypted credentials and isolated execution. Zero-knowledge key management so your keys never leave your control.",
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
          The MCP marketplace for prediction markets
        </h2>
        <p className="mb-16 max-w-2xl text-zinc-400">
          Discover MCP servers, connect AI agents to live markets, and trade
          across Polymarket, Kalshi, and more—all through one protocol.
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
