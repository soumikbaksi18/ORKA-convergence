import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background: faint ticker-style text */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute left-1/4 top-1/4 text-[10vw] font-bold leading-none text-white/[0.03]">
          BTC/USD
        </div>
        <div className="absolute right-1/4 top-1/3 text-[8vw] font-bold leading-none text-white/[0.03]">
          ETH
        </div>
        <div className="absolute bottom-1/4 left-1/3 text-[6vw] font-bold leading-none text-white/[0.02]">
          prediction markets
        </div>
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Now live — v2.0 with multi-platform trading
        </p>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          The AI terminal for{" "}
          <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]">
            prediction markets
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400">
          Deploy autonomous trading bots, run quant analysis, and trade across
          leading prediction platforms — all from one AI-powered interface.
        </p>
        <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/70 bg-purple-500/10 px-6 py-3 text-base font-medium text-white shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all hover:border-purple-400 hover:shadow-[0_0_32px_rgba(168,85,247,0.5)]"
          >
            Open Convergence →
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            ► See how it works
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <span className="flex items-center gap-2">End-to-end encrypted</span>
          <span className="flex items-center gap-2">No credit card required</span>
          <span className="flex items-center gap-2">Free tier available</span>
        </div>
      </div>
    </section>
  );
}
