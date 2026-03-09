import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <Link href="/" className="text-lg font-semibold text-white">
          ORKA
        </Link>
        <nav className="flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#platforms"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Platforms
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            How it works
          </Link>
        </nav>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} ORKA. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
