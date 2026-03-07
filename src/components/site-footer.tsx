import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-white/80">
      <div className="container-shell grid gap-6 py-8 sm:py-10 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">About</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Independent Ukraine-focused news, editorial analysis, topic archives, and support
            resources in one clear publication.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Trust</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/editorial-policy">Editorial Policy</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Sections</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
            <Link href="/news">News</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/donate">Donate</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
