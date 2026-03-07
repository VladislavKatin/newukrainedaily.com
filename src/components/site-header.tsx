import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/blog", label: "Blog" },
  { href: "/donate", label: "Donate" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="container-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/" className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            newukrainedaily.com
          </p>
          <p className="mt-1 text-base font-semibold text-ink sm:text-lg">New Ukraine Daily</p>
        </Link>
        <nav className="flex flex-wrap gap-1.5 text-sm font-medium text-slate-600 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-line hover:bg-mist hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
