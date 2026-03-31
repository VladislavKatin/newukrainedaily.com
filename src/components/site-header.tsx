import Link from "next/link";

const primaryNavItems = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/blog", label: "Analysis" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/contact", label: "Contact" }
];

const trustNavItems = [
  { href: "/about", label: "About" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/corrections", label: "Corrections" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="border-b border-line/60 bg-[#f8fbff]">
        <div className="container-shell flex flex-wrap items-center justify-between gap-2 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 sm:text-xs">
          <p className="text-brand">Edited from Zaporizhzhia, Ukraine</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {trustNavItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-ink">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="container-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
        <Link href="/" className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            newukrainedaily.com
          </p>
          <p className="mt-1 text-base font-semibold text-ink sm:text-lg">New Ukraine Daily</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Ukraine reporting, explainers, and practical support coverage.
          </p>
        </Link>
        <nav className="flex flex-wrap gap-1.5 text-sm font-medium text-slate-600 sm:gap-2">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-line hover:bg-mist hover:text-ink sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/donate"
            className="rounded-full border border-brand/15 bg-brand px-3 py-1.5 text-white transition hover:bg-brand/90"
          >
            Support
          </Link>
        </nav>
      </div>
    </header>
  );
}
