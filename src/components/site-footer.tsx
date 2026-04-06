import Link from "next/link";

const trustLinks = [
  { href: "/about", label: "About" },
  { href: "/newsroom", label: "Newsroom" },
  { href: "/editorial-policy", label: "Editorial Policy" },
  { href: "/corrections", label: "Corrections" },
  { href: "/contact", label: "Contact" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-white/80">
      <div className="border-b border-line/60 bg-[#f8fbff]">
        <div className="container-shell grid gap-4 py-5 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Newsroom Base</p>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-[15px]">
              New Ukraine Daily is edited from <strong className="text-ink">Zaporizhzhia, Ukraine</strong>, with newsroom work taking place close to the frontline in southern Ukraine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {trustLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:bg-mist hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="container-shell grid gap-6 py-8 sm:py-10 md:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">About</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            New Ukraine Daily is an English-language newsroom focused on Ukraine, diplomacy,
            recovery, aid, and accountability.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Coverage</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/news">Latest News</Link>
            <Link href="/world">World Digest</Link>
            <Link href="/blog">Analysis and Explainers</Link>
            <Link href="/donate">Support Ukraine</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Trust</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/newsroom">Newsroom</Link>
            <Link href="/about">About</Link>
            <Link href="/editorial-policy">Editorial Policy</Link>
            <Link href="/corrections">Corrections</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Contact</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/contact">Contact the newsroom</Link>
            <span>vladkatintam@gmail.com</span>
            <Link href="/feed.xml">News feed</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
