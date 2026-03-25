import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { ArticleBody } from "@/components/article-body";
import { ArticleKeyFacts } from "@/components/article-key-facts";
import { NewsletterCta } from "@/components/newsletter-cta";
import { RelatedEntries } from "@/components/related-entries";
import { getEntriesByType, getEntry } from "@/lib/content";
import { shouldBypassImageOptimization } from "@/lib/image";
import { buildRelatedEntries } from "@/lib/related-content";
import { buildArticleMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};
export const revalidate = 300;

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

  const related = buildRelatedEntries(entry, await getEntriesByType("blog"), 3);
  const unoptimizedImage = shouldBypassImageOptimization(entry.imageUrl);

  return (
    <section className="container-shell py-8 sm:py-16">
      <ArticleJsonLd entry={entry} />
      <article className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="panel p-5 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Analysis
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-4xl">
            {entry.title}
          </h1>
          <p className="lede-copy mt-4 sm:mt-5">{entry.lead || entry.description}</p>
          <div className="meta-row mt-5 sm:mt-6">
            <span>{entry.author}</span>
            {entry.storyFormat ? <span>{entry.storyFormat}</span> : null}
            {entry.readingTimeMinutes ? <span>{entry.readingTimeMinutes} min read</span> : null}
            <time dateTime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleDateString("en-US")}</time>
          </div>
          {entry.imageUrl ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-line sm:mt-8">
              <Image
                src={entry.imageUrl}
                alt={entry.imageAlt || entry.title}
                width={1200}
                height={675}
                unoptimized={unoptimizedImage}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          ) : null}
          {entry.previewImageCaption ? (
            <p className="mt-3 text-xs text-slate-500">{entry.previewImageCaption}</p>
          ) : null}
          <ArticleBody paragraphs={entry.body} />
          <div className="mt-8">
            <NewsletterCta compact title="Get the next explainer" description="Request the daily Ukraine briefing or ask the newsroom to expand a topic that needs a deeper explainer." />
          </div>
          <RelatedEntries title="Related Posts" entries={related} />
        </div>
        <div className="grid gap-6 lg:sticky lg:top-24">
          <ArticleKeyFacts lead={entry.lead} body={entry.body} tags={entry.tags} />
          <div className="panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Explainer standard</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <p>Analysis pages are meant to slow the story down.</p>
              <p>They connect current reporting to policy, reconstruction, aid, and long-term consequences.</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
