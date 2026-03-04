import { EntryCard } from "@/components/entry-card";
import { PaginationNav } from "@/components/pagination-nav";
import { PageShell } from "@/components/page-shell";
import { getEntriesByTypePage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);

  return buildMetadata({
    title: currentPage > 1 ? `News - Page ${currentPage}` : "News",
    description: "Published Ukraine news archive with server-rendered pagination.",
    path: currentPage > 1 ? `/news?page=${currentPage}` : "/news",
    keywords: ["Ukraine news", "news feed", "automated news"]
  });
}

export default async function NewsPage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const { entries, total } = await getEntriesByTypePage("news", {
    limit: PAGE_SIZE,
    offset
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageShell
        eyebrow="News"
        title="Latest news"
        description="Recent Ukraine coverage from official, institutional, and editorial sources."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-6">
          {entries.length > 0 ? (
            entries.map((entry) => <EntryCard key={entry.slug} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published news items are currently available.
            </div>
          )}
        </div>
        <PaginationNav basePath="/news" currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
