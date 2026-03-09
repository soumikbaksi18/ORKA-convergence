import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <img
            src="/orka-logo.png"
            alt="ORKA"
            className="h-11 w-auto object-contain [mix-blend-mode:lighten]"
            width={160}
            height={48}
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-zinc-300 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-zinc-300 transition-colors hover:text-white"
          >
            How it works
          </Link>
          <Link
            href="#platforms"
            className="text-sm text-zinc-300 transition-colors hover:text-white"
          >
            Platforms
          </Link>
        </nav>
        <Link
          href="/app"
          className="rounded-lg border border-purple-500/60 bg-transparent px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:border-purple-400 hover:shadow-[0_0_28px_rgba(168,85,247,0.5)]"
        >
          Launch App
        </Link>
      </div>
    </header>
  );
}
