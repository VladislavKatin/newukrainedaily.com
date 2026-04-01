import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { ArticleBody } from "@/components/article-body";
import { ArticleOverview } from "@/components/article-overview";
import { ArticleKeyFacts } from "@/components/article-key-facts";
import { ArticleShareBar } from "@/components/article-share-bar";
import { NewsletterCta } from "@/components/newsletter-cta";
import { RelatedEntries } from "@/components/related-entries";
import { getEntry, getEntrySlugsByType, getRelatedEntries } from "@/lib/content";
import { shouldBypassImageOptimization } from "@/lib/image";
import { buildArticleMetadata } from "@/lib/seo";
import { SUPPORTED_TOPICS, topicSlugFromLabel } from "@/lib/topic-taxonomy";
import { absoluteUrl } from "@/lib/site";
import { getStoryFormatConfig } from "@/lib/story-format";

type Props = {
  params: Promise<{ slug: string }>;
};
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getEntrySlugsByType("blog", 200);
  return slugs.map((slug) => ({ slug }));
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

  const related = await getRelatedEntries("blog", entry.slug, 3);
  const unoptimizedImage = shouldBypassImageOptimization(entry.imageUrl);
  const formatConfig = getStoryFormatConfig(entry);
  const shareUrl = absoluteUrl(`/blog/${entry.slug}`);
  const linkedTopics = new Set(SUPPORTED_TOPICS.map((topic) => topic.toLowerCase()));
  const visibleTopicTags = entry.tags.filter((tag) => linkedTopics.has(tag.toLowerCase())).slice(0, 4);

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
          </div>
          <ArticleShareBar title={entry.title} url={shareUrl} />
          {visibleTopicTags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTopicTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/topic/${topicSlugFromLabel(tag)}`}
                  className="rounded-full bg-sky px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-sky/70"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
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
          <ArticleOverview
            title="What this explainer covers"
            keyPoints={entry.keyPoints}
            whyItMatters={entry.whyItMatters || entry.lead}
            sourceUrl={entry.sourceUrl}
          />
          <ArticleBody paragraphs={entry.body} />
          <div className="mt-8">
            <NewsletterCta
              compact
              sourcePage={`/blog/${entry.slug}`}
              title={formatConfig.newsletterTitle}
              description={formatConfig.newsletterDescription}
            />
          </div>
          <RelatedEntries title="Related Posts" entries={related} />
        </div>
        <div className="grid gap-6 lg:sticky lg:top-24">
          <ArticleKeyFacts lead={entry.lead} body={entry.body} tags={entry.tags} keyPoints={entry.keyPoints} whyItMatters={entry.whyItMatters} />
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
