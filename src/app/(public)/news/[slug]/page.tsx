import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleJsonLd } from "@/components/article-json-ld";
import { ArticleBody } from "@/components/article-body";
import { RelatedEntries } from "@/components/related-entries";
import { getEntriesByType, getEntry } from "@/lib/content";
import { buildRelatedEntries } from "@/lib/related-content";
import { buildArticleMetadata } from "@/lib/seo";

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

  return (
    <section className="container-shell py-8 sm:py-16">
      <ArticleJsonLd entry={entry} />
      <article className="panel mx-auto max-w-3xl p-5 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          News
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:mt-4 sm:text-4xl">
          {entry.title}
        </h1>
        <p className="lede-copy mt-4 sm:mt-5">{entry.lead || entry.description}</p>
        <div className="meta-row mt-5 sm:mt-6">
          <span>{entry.author}</span>
          <time dateTime={entry.publishedAt}>{new Date(entry.publishedAt).toLocaleDateString("en-US")}</time>
        </div>
        {entry.previewImageUrl ? (
          <div className="mt-6 overflow-hidden rounded-3xl border border-line sm:mt-8">
            <Image
              src={entry.previewImageUrl}
              alt={entry.previewImageAlt || entry.title}
              width={1200}
              height={675}
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
          <p className="mt-7 text-sm leading-6 text-slate-500 sm:mt-8">
            {entry.sourceAttribution || "Source:"}{" "}
            <span className="font-medium text-ink">
              {entry.author}
            </span>
          </p>
        ) : null}
        <RelatedEntries title="Related News" entries={related} />
      </article>
    </section>
  );
}