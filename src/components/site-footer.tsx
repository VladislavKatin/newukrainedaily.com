import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-white/80">
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
            <Link href="/blog">Analysis and Explainers</Link>
            <Link href="/donate">Support Ukraine</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Trust</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/newsroom">Newsroom</Link>
            <Link href="/editorial-policy">Editorial Policy</Link>
            <Link href="/corrections">Corrections</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Contact</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/contact">Contact the newsroom</Link>
            <Link href="mailto:vladkatintam@gmail.com">vladkatintam@gmail.com</Link>
            <Link href="/feed.xml">News feed</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
