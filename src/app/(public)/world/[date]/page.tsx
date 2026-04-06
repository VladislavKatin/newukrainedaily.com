import Link from "next/link";
import { notFound } from "next/navigation";
import { WorldDigestCard } from "@/components/world-digest-card";
import { buildMetadata } from "@/lib/seo";
import { formatWorldDigestDate, isWorldDigestDate } from "@/lib/world/date";
import { listRecentWorldDigestDates, listWorldDigestDatesForSitemap, listWorldDigestItemsByDate } from "@/lib/world-repository";

type Props = {
  params: Promise<{ date: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const dates = await listWorldDigestDatesForSitemap(365);
  return dates.map((date) => ({ date }));
}

export async function generateMetadata({ params }: Props) {
  const { date } = await params;
  if (!isWorldDigestDate(date)) {
    return {};
  }

  const readableDate = formatWorldDigestDate(date);
  return buildMetadata({
    title: `World News Digest Archive for ${readableDate}`,
    description: `Archived world news digest for ${readableDate} with compact coverage of wars, politics, sanctions, markets, and major international developments.`,
    path: `/world/${date}`,
    keywords: ["world news archive", "daily world digest archive", readableDate, "world news summary archive"],
    imagePath: "/og-world-hub.svg",
    imageAlt: `World news digest for ${readableDate}`
  });
}

export default async function WorldArchivePage({ params }: Props) {
  const { date } = await params;
  if (!isWorldDigestDate(date)) {
    notFound();
  }

  const [items, recentDates] = await Promise.all([
    listWorldDigestItemsByDate(date),
    listRecentWorldDigestDates(10)
  ]);

  if (items.length === 0) {
    notFound();
  }

  const archiveDates = recentDates.filter((value) => value !== date).slice(0, 8);

  return (
    <section className="container-shell py-6 sm:py-10">
      <div className="mb-5 rounded-[24px] border border-line bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">World Archive</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">World News Digest Archive</h1>
              <span className="rounded-full border border-line bg-[#f8fbff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {items.length} archived stories
              </span>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Archived digest for {formatWorldDigestDate(date)}. This page preserves that day&apos;s global news selection with compact summaries, visible HTML text, and clear source attribution.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-ink">
            {formatWorldDigestDate(date)}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/world" className="rounded-full border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-mist hover:text-ink">
            Open today&apos;s world digest
          </Link>
          {archiveDates.map((archiveDate) => (
            <Link
              key={archiveDate}
              href={`/world/${archiveDate}`}
              className="rounded-full border border-line bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-mist hover:text-ink"
            >
              World digest for {formatWorldDigestDate(archiveDate)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((item) => <WorldDigestCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
