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
    <header className="border-b border-line/70 bg-white/85 backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Ukraine Support
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">SEO Machine</p>
        </Link>
        <nav className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-3 py-2 transition hover:border-line hover:bg-mist hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

