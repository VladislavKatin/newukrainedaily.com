import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { ArticleBody } from "@/components/article-body";
import { ArticleKeyFacts } from "@/components/article-key-facts";
import { ArticleStatusBanner } from "@/components/article-status-banner";
import { NewsletterCta } from "@/components/newsletter-cta";
import { RelatedEntries } from "@/components/related-entries";
import { getEntriesByType, getEntry } from "@/lib/content";
import { shouldBypassImageOptimization } from "@/lib/image";
import { buildRelatedEntries } from "@/lib/related-content";
import { buildArticleMetadata } from "@/lib/seo";
import { getStoryFormatConfig } from "@/lib/story-format";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntry("news", slug);

  if (!entry) {
    return {};
  }

  return buildArticleMetadata(entry);
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const entry = await getEntry("news", slug);

  if (!entry) {
    notFound();
  }

  const related = buildRelatedEntries(entry, await getEntriesByType("news"), 3);
  const unoptimizedPreview = shouldBypassImageOptimization(entry.previewImageUrl);
  const unoptimizedGenerated = shouldBypassImageOptimization(entry.generatedImageUrl);
  const formatConfig = getStoryFormatConfig(entry);

  return (
    <section className="container-shell py-8 sm:py-16">
      <ArticleJsonLd entry={entry} />
      <article className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="panel p-5 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            {formatConfig.sectionEyebrow}
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
            {entry.updatedAt ? <span>Updated {new Date(entry.updatedAt).toLocaleDateString("en-US")}</span> : null}
          </div>
          <ArticleStatusBanner entry={entry} />
          {entry.previewImageUrl ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-line sm:mt-8">
              <Image
                src={entry.previewImageUrl}
                alt={entry.previewImageAlt || entry.title}
                width={1200}
                height={675}
                unoptimized={unoptimizedPreview}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          ) : null}
          {entry.previewImageCaption ? (
            <p className="mt-3 text-xs text-slate-500">{entry.previewImageCaption}</p>
          ) : null}
          <ArticleBody
            paragraphs={entry.body}
            showGeneratedImageAfterIndex={0}
            generatedImage={
              entry.generatedImageUrl &&
              entry.generatedImageUrl !== entry.previewImageUrl ? (
                <figure className="overflow-hidden rounded-3xl border border-line">
                  <Image
                    src={entry.generatedImageUrl}
                    alt={entry.generatedImageAlt || entry.title}
                    width={1200}
                    height={675}
                    unoptimized={unoptimizedGenerated}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="h-auto w-full object-cover"
                  />
                  {entry.generatedImageCaption ? (
                    <figcaption className="border-t border-line bg-mist px-4 py-3 text-xs leading-5 text-slate-600">
                      {entry.generatedImageCaption}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null
            }
          />
          {entry.sourceAttribution || entry.author ? (
            <div className="mt-8 rounded-2xl border border-line bg-mist/70 p-4 text-sm leading-6 text-slate-600">
              <p>
                <span className="font-semibold text-ink">{entry.sourceAttribution || "Source:"}</span>{" "}
                <span>{entry.author}</span>
              </p>
              <p className="mt-2">
                This report is maintained as a live newsroom article. Headlines and top paragraphs may be tightened when fresh reporting changes the clearest angle.
              </p>
            </div>
          ) : null}
          <div className="mt-8">
            <NewsletterCta
              compact
              sourcePage={`/news/${entry.slug}`}
              title={formatConfig.newsletterTitle}
              description={formatConfig.newsletterDescription}
            />
          </div>
          <RelatedEntries title="Related News" entries={related} />
        </div>
        <div className="grid gap-6 lg:sticky lg:top-24">
          <ArticleKeyFacts lead={entry.lead} body={entry.body} tags={entry.tags} />
          <div className="panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{formatConfig.sidebarTitle}</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              {formatConfig.sidebarPoints.map((point) => (
                <p key={point}>{point}</p>
              ))}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}