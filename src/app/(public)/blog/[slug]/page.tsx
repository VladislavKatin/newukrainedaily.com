import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { RelatedEntries } from "@/components/related-entries";
import { getEntriesByTag, getEntriesByType, getEntry } from "@/lib/content";
import { buildArticleMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const entries = await getEntriesByType("blog");
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntry("blog", slug);

  if (!entry) {
    return {};
  }

  return buildArticleMetadata(entry);
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const entry = await getEntry("blog", slug);

  if (!entry) {
    notFound();
  }

  const related = (
    await Promise.all(entry.tags.slice(0, 3).map((tag) => getEntriesByTag(tag)))
  )
    .flat()
    .filter((candidate) => candidate.type === "blog" && candidate.slug !== entry.slug)
    .filter(
      (candidate, index, array) =>
        array.findIndex((item) => item.slug === candidate.slug && item.type === candidate.type) ===
        index
    )
    .slice(0, 3);

  return (
    <section className="container-shell py-12 sm:py-16">
      <ArticleJsonLd entry={entry} />
      <article className="panel mx-auto max-w-3xl p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          Blog post placeholder
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">{entry.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{entry.description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>{entry.author}</span>
          <time dateTime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleDateString("en-US")}</time>
        </div>
        {entry.imageUrl ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-line">
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt || entry.title}
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        ) : null}
        <div className="mt-8 space-y-6 text-base leading-8 text-slate-700">
          {entry.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <RelatedEntries title="Related Posts" entries={related} />
      </article>
    </section>
  );
}
