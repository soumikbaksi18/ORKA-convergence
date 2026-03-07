import Link from "next/link";

export function CTA() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Ready to trade smarter?
        </h2>
        <p className="mb-8 text-zinc-400">
          Join thousands of traders using AI to navigate prediction markets.
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/70 bg-purple-500/10 px-8 py-4 text-base font-medium text-white shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all hover:border-purple-400 hover:shadow-[0_0_32px_rgba(168,85,247,0.5)]"
        >
          Open Convergence →
        </Link>
        <p className="mt-6 text-sm text-zinc-500">
          Free to start · No credit card · API keys stay encrypted on your
          device
        </p>
      </div>
    </section>
  );
}
