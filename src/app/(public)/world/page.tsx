import Link from "next/link";
import { WorldDigestCard } from "@/components/world-digest-card";
import { WorldDigestSeoBlock } from "@/components/world-digest-seo-block";
import { buildMetadata } from "@/lib/seo";
import { generateWorldDigestForDate } from "@/lib/world/digest";
import { formatWorldDigestDate, worldDigestDateFromDate } from "@/lib/world/date";
import { listRecentWorldDigestDates, listWorldDigestItemsByDate } from "@/lib/world-repository";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const digestDate = worldDigestDateFromDate();
  const readableDate = formatWorldDigestDate(digestDate);

  return buildMetadata({
    title: `World News Digest for ${readableDate}`,
    description: `Daily world news digest for ${readableDate} with compact summaries of major wars, politics, sanctions, markets, and international developments in one fast server-rendered page.`,
    path: "/world",
    keywords: [
      "world news digest",
      "daily world news summary",
      "global politics digest",
      "world news today summary",
      "international news digest"
    ],
    imagePath: "/og-world-hub.svg",
    imageAlt: "World news digest"
  });
}

export default async function WorldPage() {
  const digestDate = worldDigestDateFromDate();
  let [items, recentDates] = await Promise.all([
    listWorldDigestItemsByDate(digestDate),
    listRecentWorldDigestDates(8)
  ]);

  if (items.length === 0) {
    try {
      const result = await generateWorldDigestForDate(digestDate);

      if (result.savedItems > 0) {
        [items, recentDates] = await Promise.all([
          listWorldDigestItemsByDate(digestDate),
          listRecentWorldDigestDates(8)
        ]);
      }
    } catch (error) {
      console.error("[world] failed to auto-generate today's digest", error);
    }
  }

  const archiveDates = recentDates.filter((date) => date !== digestDate).slice(0, 7);

  return (
    <section className="container-shell py-6 sm:py-10">
      <div className="mb-5 rounded-[24px] border border-line bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">World</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">World News Digest</h1>
              <span className="rounded-full border border-line bg-[#f8fbff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {items.length} stories today
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Today&apos;s international digest in a compact newsroom format. Fresh global developments from the last 24 hours, summarized in plain English and rendered directly in HTML for readers and search engines.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-ink">
            {formatWorldDigestDate(digestDate)}
          </div>
        </div>
        {archiveDates.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {archiveDates.map((date) => (
              <Link
                key={date}
                href={`/world/${date}`}
                className="rounded-full border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-mist hover:text-ink"
              >
                World digest for {formatWorldDigestDate(date)}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => <WorldDigestCard key={item.id} item={item} />)
        ) : (
          <div className="panel p-6 text-sm leading-7 text-slate-600 xl:col-span-2">
            Today&apos;s world digest is not published yet. The page tried to generate it automatically, but no digest items were available from the current feed set.
          </div>
        )}
      </div>

      <WorldDigestSeoBlock digestDate={digestDate} itemCount={items.length} />
    </section>
  );
}
