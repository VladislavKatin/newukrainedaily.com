import Link from "next/link";
import { WorldDigestCard } from "@/components/world-digest-card";
import { buildMetadata } from "@/lib/seo";
import { formatWorldDigestDate, worldDigestDateFromDate } from "@/lib/world/date";
import { listRecentWorldDigestDates, listWorldDigestItemsByDate } from "@/lib/world-repository";

export const revalidate = 1800;

export async function generateMetadata() {
  const digestDate = worldDigestDateFromDate();
  const readableDate = formatWorldDigestDate(digestDate);

  return buildMetadata({
    title: `World News Digest for ${readableDate}`,
    description: `Daily world news digest for ${readableDate} with compact summaries of major wars, politics, sanctions, economies, and international developments.`,
    path: "/world",
    keywords: ["world news digest", "daily world news summary", "global politics digest"],
    imagePath: "/og-world-hub.svg",
    imageAlt: "World news digest"
  });
}

export default async function WorldPage() {
  const digestDate = worldDigestDateFromDate();
  const [items, recentDates] = await Promise.all([
    listWorldDigestItemsByDate(digestDate),
    listRecentWorldDigestDates(8)
  ]);

  const archiveDates = recentDates.filter((date) => date !== digestDate).slice(0, 7);

  return (
    <section className="container-shell py-8 sm:py-12">
      <div className="mb-6 rounded-[24px] border border-line bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">World</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">World News Digest</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
              Today&apos;s international digest in a compact newsroom format. Fresh global developments from the last 24 hours, summarized in plain English and rendered directly in HTML.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-ink">
            {formatWorldDigestDate(digestDate)}
          </div>
        </div>
        {archiveDates.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {archiveDates.map((date) => (
              <Link
                key={date}
                href={`/world/${date}`}
                className="rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-mist hover:text-ink"
              >
                World digest for {formatWorldDigestDate(date)}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {items.length > 0 ? (
          items.map((item) => <WorldDigestCard key={item.id} item={item} />)
        ) : (
          <div className="panel p-6 text-sm leading-7 text-slate-600">
            Today&apos;s world digest is not published yet. Once the first scheduled run lands, this page will show a clean daily set of global news summaries here.
          </div>
        )}
      </div>
    </section>
  );
}
