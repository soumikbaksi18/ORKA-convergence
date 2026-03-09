import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-black px-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-semibold text-white">
          Convergence
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/app/markets"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Markets
          </Link>
          <Link
            href="/app/agent-markets"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Agent Markets
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 sm:flex min-w-[140px]">
          <span className="text-zinc-400">Search</span>
          <svg
            className="ml-2 h-4 w-4 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 min-w-[120px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Portfolio</p>
            <p className="mt-0.5 text-sm font-semibold text-white">—</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 min-w-[100px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Cash</p>
            <p className="mt-0.5 text-sm font-semibold text-white">—</p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
        >
          Deposit
        </button>
        <button type="button" className="p-1.5 text-zinc-400 hover:text-white">
          <SettingsIcon />
        </button>
        <button type="button" className="p-1.5 text-zinc-400 hover:text-white">
          <BellIcon />
        </button>
        <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
      </div>
    </header>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
