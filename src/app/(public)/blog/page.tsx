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
    title: currentPage > 1 ? `Blog - Page ${currentPage}` : "Blog",
    description: "Published blog archive with explainers, editorial analysis, and practical support coverage related to Ukraine.",
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
        title="Analysis and explainers"
        description="Longer-form editorial posts on support, reconstruction, resilience, and the policy questions shaping Ukraine's future."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.length > 0 ? (
            entries.map((entry) => <EntryCard key={entry.slug} entry={entry} compact />)
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
