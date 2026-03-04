import "server-only";
import { query } from "@/lib/db";
import { buildInternalLinks } from "@/lib/internal-linker";
import { listBlog, listRecentPublishedNews, type NewsItemRecord } from "@/lib/postgres-repository";
import { normalizeCanonicalUrl, readingTimeMinutes, wordCount, charCount } from "@/lib/news-normalization";
import { getBaseUrl } from "@/lib/site";

function clampText(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, limit - 1)).trim()}…`;
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildDescription(...values: Array<string | null | undefined>) {
  const combined = values
    .map((value) => (value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");

  return combined;
}

function ensureNewsBody(item: NewsItemRecord) {
  if (item.content && item.content.trim().length > 0) {
    return item.content.trim();
  }

  return buildDescription(item.summary, item.dek, item.whyItMatters, item.title);
}

function buildCanonical(path: string, current: string | null | undefined) {
  return normalizeCanonicalUrl(current) || `${getBaseUrl().replace(/\/+$/, "")}${path}`;
}

export async function refreshPublishedSeoContent() {
  const publishedNews = await listRecentPublishedNews(400);
  let updatedNews = 0;
  let updatedBlog = 0;

  for (const item of publishedNews) {
    const content = ensureNewsBody(item);
    const dek = (item.dek || item.summary || item.title).trim();
    const summary = (item.summary || dek || item.title).trim();
    const topics = dedupe(item.topics);
    const entities = dedupe(item.entities);
    const tags = dedupe(item.tags);
    const primaryTopic = item.primaryTopic || topics[0] || tags[0] || "World";

    const metaTitle = clampText(item.metaTitle || item.title, 70);
    const metaDescription = clampText(
      item.metaDescription || buildDescription(summary, item.whyItMatters, `Source: ${item.sourceName || "news desk"}.`),
      160
    );
    const canonicalUrl = buildCanonical(`/news/${item.slug}`, item.canonicalUrl);
    const ogImageUrl = item.ogImageUrl || item.generatedImageUrl || item.coverImageUrl || item.previewImageUrl || null;
    const ogImageAlt = (item.ogImageAlt || item.generatedImageAlt || `${item.title} cover image`).trim();
    const reading = readingTimeMinutes(content || summary);
    const words = wordCount(content || summary);
    const chars = charCount(content || summary);
    const linkBundle = buildInternalLinks(item, publishedNews);

    await query(
      `
        update news_items
        set
          dek = $2,
          summary = $3,
          content = $4,
          tags = $5::text[],
          topics = $6::text[],
          entities = $7::text[],
          primary_topic = $8,
          meta_title = $9,
          meta_description = $10,
          canonical_url = $11,
          og_image_url = $12,
          og_image_alt = $13,
          reading_time_minutes = $14,
          word_count = $15,
          char_count = $16,
          internal_links = $17::jsonb,
          related_ids = $18::uuid[],
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        item.id,
        dek || null,
        summary || null,
        content || null,
        tags,
        topics,
        entities,
        primaryTopic,
        metaTitle || null,
        metaDescription || null,
        canonicalUrl,
        ogImageUrl,
        ogImageAlt,
        reading,
        words,
        chars,
        JSON.stringify(linkBundle.links),
        linkBundle.relatedIds
      ]
    );

    updatedNews += 1;
  }

  const publishedBlog = await listBlog(200, "published");

  for (const post of publishedBlog) {
    const excerpt = clampText(
      post.excerpt || buildDescription(post.body, post.title),
      300
    );
    const metaTitle = clampText(post.metaTitle || post.title, 70);
    const metaDescription = clampText(post.metaDescription || excerpt || post.title, 160);
    const canonicalUrl = buildCanonical(`/blog/${post.slug}`, post.canonicalUrl);
    const ogImageUrl = post.ogImageUrl || post.coverImageUrl || null;
    const ogImageAlt = (post.ogImageAlt || `${post.title} cover image`).trim();
    const reading = readingTimeMinutes(post.body || excerpt || post.title);
    const words = wordCount(post.body || excerpt || post.title);
    const chars = charCount(post.body || excerpt || post.title);

    await query(
      `
        update blog_posts
        set
          excerpt = $2,
          meta_title = $3,
          meta_description = $4,
          canonical_url = $5,
          og_image_url = $6,
          og_image_alt = $7,
          reading_time_minutes = $8,
          word_count = $9,
          char_count = $10,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        post.id,
        excerpt || null,
        metaTitle || null,
        metaDescription || null,
        canonicalUrl,
        ogImageUrl,
        ogImageAlt,
        reading,
        words,
        chars
      ]
    );

    updatedBlog += 1;
  }

  return {
    ok: true,
    updatedNews,
    totalNews: publishedNews.length,
    updatedBlog,
    totalBlog: publishedBlog.length
  };
}
