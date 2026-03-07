const steps = [
  {
    step: "1",
    title: "Connect",
    description: "Link your wallet and supported prediction market accounts. Your keys stay encrypted on your device.",
  },
  {
    step: "2",
    title: "Analyze & trade",
    description: "Use the unified terminal to scan markets, run quant analysis, and execute across platforms in one place.",
  },
  {
    step: "3",
    title: "Automate",
    description: "Deploy bots and let AI help you find edges, track whales, and manage positions 24/7.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          How it works
        </p>
        <h2 className="mb-16 text-3xl font-bold text-white sm:text-4xl">
          Three steps to smarter prediction trading
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-purple-500/20"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10 text-sm font-bold text-purple-300">
                {item.step}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
