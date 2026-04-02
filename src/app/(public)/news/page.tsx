import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { PaginationNav } from "@/components/pagination-nav";
import { PageShell } from "@/components/page-shell";
import { getEntriesByTypePage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

export const revalidate = 300;

type Props = {
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);

  return buildMetadata({
    title: currentPage > 1 ?             `News - Page ${currentPage}` : "News",
    description: "Published Ukraine news archive with stronger editorial curation, fast updates, and structured story discovery.",
    path: currentPage > 1 ? `/news?page=${currentPage}` : "/news",
    keywords: ["Ukraine news", "latest Ukraine updates", "Ukraine war news"],
    imagePath: "/og-news-hub.svg",
    imageAlt: "Latest Ukraine news"
  });
}

export default async function NewsPage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const { entries, total } = await getEntriesByTypePage("news", {
    limit: PAGE_SIZE,
    offset,
    mode: "latest"
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [leadEntry, ...restEntries] = entries;
  const updateRail = restEntries.slice(0, 4);
  const archiveEntries = restEntries.slice(4);

  return (
    <>
      <PageShell
        eyebrow="News"
        title="Latest news"
        description="Recent Ukraine coverage with stronger editorial ordering, fast updates, and direct paths into major story lines."
      />
      <div className="container-shell pb-12 sm:pb-16">
        {leadEntry ? (
          <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-brand">Latest report</p>
              <EntryCard entry={leadEntry} />
            </div>
            <div className="panel p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Newest first</p>
              <div className="mt-4 space-y-4">
                {updateRail.map((entry) => (
                  <article key={entry.slug} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      <span>{entry.storyFormat || entry.type}</span>
                      <span>{new Date(entry.publishedAt).toLocaleDateString("en-US")}</span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold leading-6 text-ink">
                      <Link href={`/news/${entry.slug}`} className="transition hover:text-brand">
                        {entry.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{entry.excerpt || entry.lead || entry.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Archive</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">More recent reports</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              A reverse-chronological archive of current Ukraine reporting, with the newest published stories shown first.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {archiveEntries.length > 0 ? (
              archiveEntries.map((entry) => <EntryCard key={entry.slug} entry={entry} compact />)
            ) : entries.length > 0 ? null : (
              <div className="panel p-6 text-sm leading-6 text-slate-600">
                No published news items are currently available.
              </div>
            )}
          </div>
        </section>
        <PaginationNav basePath="/news" currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
