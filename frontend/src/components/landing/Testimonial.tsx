export function Testimonial() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="mb-6 block text-6xl text-purple-500/40">"</span>
        <blockquote className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
          Convergence lets me run auto trading bots, do quant analysis, get
          unique insights behind whale trades, and find arbitrage across
          platforms — all from one place.
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-medium text-white">
            A
          </div>
          <div className="text-left">
            <p className="font-semibold text-white">Active Trader</p>
            <p className="text-sm text-zinc-500">Polymarket & Kalshi</p>
          </div>
        </div>
      </div>
    </section>
  );
}
