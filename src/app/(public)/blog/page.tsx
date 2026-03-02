import { EntryCard } from "@/components/entry-card";
import { PaginationNav } from "@/components/pagination-nav";
import { PageShell } from "@/components/page-shell";
import { getEntriesByTypePage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

type Props = {
  searchParams?: Promise<{ page?: string }>;
};

export async function generateMetadata({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);

  return buildMetadata({
    title: currentPage > 1 ? `Blog - Page ${currentPage}` : "Blog",
    description: "Published blog archive with reports, explainers, and editorial posts.",
    path: currentPage > 1 ? `/blog?page=${currentPage}` : "/blog",
    keywords: ["Ukraine blog", "reports", "editorial analysis"]
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const { entries, total } = await getEntriesByTypePage("blog", {
    limit: PAGE_SIZE,
    offset
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageShell
        eyebrow="Blog"
        title="Blog list placeholder"
        description="Use this section for evergreen explainers, editorial reports, and structured topic support."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-6">
          {entries.length > 0 ? (
            entries.map((entry) => <EntryCard key={entry.slug} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published blog posts are currently available.
            </div>
          )}
        </div>
        <PaginationNav basePath="/blog" currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
