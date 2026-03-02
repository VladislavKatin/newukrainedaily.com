import type { Metadata } from "next";
import { EntryCard } from "@/components/entry-card";
import { PaginationNav } from "@/components/pagination-nav";
import { PageShell } from "@/components/page-shell";
import { getAllTags, getEntriesByTagPage, getTopic } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ tag: string }>;
  searchParams?: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { tag } = await params;
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);
  const topic = await getTopic(tag);

  return buildMetadata({
    title: topic ? `Topic: ${topic.title}` : `Topic: ${tag}`,
    description:
      topic?.description || `Published coverage and analysis grouped under the ${tag} topic.`,
    path: currentPage > 1 ? `/topic/${tag}?page=${currentPage}` : `/topic/${tag}`,
    keywords: ["topic archive", tag]
  });
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { tag } = await params;
  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, Number(resolved?.page || "1") || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const [topic, pageResult] = await Promise.all([
    getTopic(tag),
    getEntriesByTagPage(tag, { limit: PAGE_SIZE, offset })
  ]);
  const { entries, total } = pageResult;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageShell
        eyebrow="Topic"
        title={topic ? topic.title : `#${tag}`}
        description={
          topic?.description ||
          "This topic archive groups related published news and blog entries under one indexable route."
        }
      />
      <div className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-6">
          {entries.length > 0 ? (
            entries.map((entry) => <EntryCard key={`${entry.type}-${entry.slug}`} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published entries are linked to this topic yet.
            </div>
          )}
        </div>
        <PaginationNav
          basePath={`/topic/${tag}`}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </>
  );
}
