import Link from "next/link";
import Image from "next/image";
import { formatWorldDigestDate } from "@/lib/world/date";

type WorldDigestSeoBlockProps = {
  digestDate: string;
  itemCount: number;
};

export function WorldDigestSeoBlock({ digestDate, itemCount }: WorldDigestSeoBlockProps) {
  const readableDate = formatWorldDigestDate(digestDate);

  return (
    <section className="mt-8 grid gap-6 rounded-[24px] border border-line bg-white p-5 sm:p-6 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="overflow-hidden rounded-[20px] border border-line bg-mist">
        <Image
          src="/world-digest-editorial.svg"
          alt="Editorial world news digest illustration"
          width={1200}
          height={900}
          sizes="(max-width: 1024px) 100vw, 420px"
          className="h-full w-full object-cover"
        />
      </div>
      <article className="reading-copy max-w-none">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">World Digest Guide</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          World news today, compact enough to scan and strong enough to index
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
          The <strong className="text-ink">world news digest for {readableDate}</strong> is built as a compact editorial page for readers who want one fast pass across wars, diplomacy, sanctions, markets, shipping routes, and major international decisions. Instead of a long infinite feed, the page keeps the top {itemCount} developments in one server-rendered archive that stays visible in HTML for search engines and human readers.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
          Each summary is rewritten in plain English, stripped of feed noise, and linked to its original source with clear attribution. That makes the page useful for people searching for long-tail queries such as <em>world news summary today</em>, <em>global politics digest</em>, <em>international sanctions update</em>, and <em>daily world economy briefing</em>.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[15px]">
          If you want deeper Ukraine coverage after scanning the international picture, move next to the <Link href="/news" className="font-semibold text-brand transition hover:text-ink">latest Ukraine news desk</Link> or the <Link href="/blog" className="font-semibold text-brand transition hover:text-ink">analysis and explainer section</Link>. For older daily snapshots, use the archive links above to open a specific world digest by date.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-[#f8fbff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Coverage</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Wars, diplomacy, markets, sanctions, energy, and major state decisions.</p>
          </div>
          <div className="rounded-2xl border border-line bg-[#f8fbff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Format</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Compact newsroom cards with source, time, thumbnail, and factual two-sentence summaries.</p>
          </div>
          <div className="rounded-2xl border border-line bg-[#f8fbff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Archive</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Daily archive pages stay indexable, canonical, and permanently accessible by date.</p>
          </div>
        </div>
      </article>
    </section>
  );
}
