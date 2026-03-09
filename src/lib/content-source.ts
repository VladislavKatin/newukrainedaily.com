import "server-only";
import type { ContentEntry } from "@/lib/content-types";
import {
  sanitizeArticleForPublishing
} from "@/lib/article-normalization";
import { getDatabaseUrl, getEnv } from "@/lib/env";
import { query } from "@/lib/db";
import {
  countBlog,
  countBlogByTag,
  countNews,
  countNewsByTag,
  getBlogBySlug,
  getNewsBySlug,
  getTopicByTag,
  listBlog,
  listBlogPage,
  listBlogByTag,
  listNews,
  listNewsPage,
  listNewsByTag,
  listTopics
} from "@/lib/postgres-repository";
import { getPreviewEntries, getPreviewTopics } from "@/lib/local-preview-content";

export type ContentRepository = {
  getAllEntries(): Promise<ContentEntry[]>;
  getEntriesByType(type: ContentEntry["type"]): Promise<ContentEntry[]>;
  getEntriesByTypePage(
    type: ContentEntry["type"],
    options: { limit: number; offset: number }
  ): Promise<{ entries: ContentEntry[]; total: number }>;
  getEntry(type: ContentEntry["type"], slug: string): Promise<ContentEntry | undefined>;
  getAllTags(): Promise<string[]>;
  getEntriesByTag(tag: string): Promise<ContentEntry[]>;
  getEntriesByTagPage(
    tag: string,
    options: { limit: number; offset: number }
  ): Promise<{ entries: ContentEntry[]; total: number }>;
  getTopic(tag: string): Promise<{ tag: string; title: string; description: string | null } | null>;
};

function sortEntries(entries: ContentEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => String(tag).trim()).filter(Boolean)));
}

function pickDisplayTags(tags: string[]) {
  return uniqueTags(tags).slice(0, 3);
}

function mapNewsItemToContentEntry(newsItem: Awaited<ReturnType<typeof getNewsBySlug>> extends infer T
  ? NonNullable<T>
  : never): ContentEntry {
  const sanitized = sanitizeArticleForPublishing({
    type: "news",
    title: newsItem.title,
    summary: newsItem.summary || newsItem.dek,
    content: newsItem.content || newsItem.summary || newsItem.dek,
    whyItMatters: newsItem.whyItMatters,
    sourceName: newsItem.sourceName,
    sourceUrl: newsItem.sourceUrl,
    previewImageUrl: newsItem.previewImageUrl,
    previewImageCaption: newsItem.previewImageCaption,
    previewImageAlt: newsItem.ogImageAlt,
    generatedImageUrl: newsItem.generatedImageUrl,
    generatedImageCaption: newsItem.generatedImageCaption,
    generatedImageAlt: newsItem.generatedImageAlt
  });

  return {
    id: newsItem.id,
    type: "news",
    slug: newsItem.slug,
    title: sanitized.title,
    description: sanitized.lead,
    excerpt: sanitized.excerpt,
    lead: sanitized.lead,
    publishedAt: newsItem.publishedAt || newsItem.createdAt,
    updatedAt: newsItem.updatedAt,
    author: newsItem.sourceName || "Editorial Desk",
    tags: pickDisplayTags(newsItem.tags),
    body: sanitized.bodyParagraphs,
    sourceAttribution: sanitized.sourceAttribution || undefined,
    sourceUrl: newsItem.sourceUrl || undefined,
    imageUrl: sanitized.primaryImageUrl,
    imageAlt: sanitized.primaryImageAlt,
    previewImageUrl: sanitized.previewImageUrl,
    previewImageAlt: sanitized.previewImageAlt,
    previewImageCaption: sanitized.previewImageCaption,
    generatedImageUrl: sanitized.generatedImageUrl,
    generatedImageAlt: sanitized.generatedImageAlt,
    generatedImageCaption: sanitized.generatedImageCaption,
    status: newsItem.status,
    featured: false
  };
}

function mapBlogPostToContentEntry(blogPost: Awaited<ReturnType<typeof getBlogBySlug>> extends infer T
  ? NonNullable<T>
  : never): ContentEntry {
  const sanitized = sanitizeArticleForPublishing({
    type: "blog",
    title: blogPost.title,
    excerpt: blogPost.excerpt,
    body: blogPost.body,
    previewImageUrl: blogPost.coverImageUrl,
    previewImageAlt: blogPost.ogImageAlt
  });

  return {
    id: blogPost.id,
    type: "blog",
    slug: blogPost.slug,
    title: sanitized.title,
    description: sanitized.lead,
    excerpt: sanitized.excerpt,
    lead: sanitized.lead,
    publishedAt: blogPost.publishedAt || blogPost.createdAt,
    updatedAt: blogPost.updatedAt,
    author: "Editorial Desk",
    tags: pickDisplayTags(blogPost.tags),
    body: sanitized.bodyParagraphs,
    imageUrl: sanitized.primaryImageUrl,
    imageAlt: sanitized.primaryImageAlt,
    previewImageUrl: sanitized.previewImageUrl,
    previewImageAlt: sanitized.previewImageAlt,
    previewImageCaption: sanitized.previewImageCaption,
    status: blogPost.status,
    featured: false
  };
}

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function hasConfiguredDatabaseUrl() {
  try {
    getDatabaseUrl();
    return true;
  } catch {
    return false;
  }
}

async function getDatabaseAvailability() {
  if (!hasConfiguredDatabaseUrl()) {
    return { ok: false, error: null };
  }

  return query("select 1")
    .then(() => ({ ok: true, error: null }))
    .catch((error) => {
      console.warn("[content] Database unavailable, returning empty content set:", error);
      return { ok: false, error };
    });
}

async function hasPublishedContent() {
  const [newsCount, blogCount] = await Promise.all([countNews(), countBlog()]);
  return newsCount + blogCount > 0;
}

function createEmptyContentRepository(): ContentRepository {
  return {
    async getAllEntries() {
      return [];
    },
    async getEntriesByType() {
      return [];
    },
    async getEntriesByTypePage() {
      return { entries: [], total: 0 };
    },
    async getEntry() {
      return undefined;
    },
    async getAllTags() {
      return [];
    },
    async getEntriesByTag() {
      return [];
    },
    async getEntriesByTagPage() {
      return { entries: [], total: 0 };
    },
    async getTopic() {
      return null;
    }
  };
}

function createPreviewContentRepository(): ContentRepository {
  const entries = getPreviewEntries();
  const topics = getPreviewTopics();

  return {
    async getAllEntries() {
      return entries;
    },
    async getEntriesByType(type) {
      return entries.filter((entry) => entry.type === type);
    },
    async getEntriesByTypePage(type, options) {
      const filtered = entries.filter((entry) => entry.type === type);
      return {
        entries: filtered.slice(options.offset, options.offset + options.limit),
        total: filtered.length
      };
    },
    async getEntry(type, slug) {
      return entries.find((entry) => entry.type === type && entry.slug === slug);
    },
    async getAllTags() {
      return topics.map((topic) => topic.tag);
    },
    async getEntriesByTag(tag) {
      return entries.filter((entry) => entry.tags.includes(tag));
    },
    async getEntriesByTagPage(tag, options) {
      const filtered = entries.filter((entry) => entry.tags.includes(tag));
      return {
        entries: filtered.slice(options.offset, options.offset + options.limit),
        total: filtered.length
      };
    },
    async getTopic(tag) {
      return topics.find((topic) => topic.tag === tag) ?? null;
    }
  };
}

function createDatabaseContentRepository(): ContentRepository {
  return {
    async getAllEntries() {
      const [newsEntries, blogEntries] = await Promise.all([listNews(100), listBlog(100)]);
      return sortEntries([
        ...newsEntries.map(mapNewsItemToContentEntry),
        ...blogEntries.map(mapBlogPostToContentEntry)
      ]);
    },
    async getEntriesByType(type) {
      if (type === "news") {
        return (await listNews(100)).map(mapNewsItemToContentEntry);
      }

      return (await listBlog(100)).map(mapBlogPostToContentEntry);
    },
    async getEntriesByTypePage(type, options) {
      if (type === "news") {
        const [entries, total] = await Promise.all([
          listNewsPage(options.limit, options.offset),
          countNews()
        ]);

        return {
          entries: entries.map(mapNewsItemToContentEntry),
          total
        };
      }

      const [entries, total] = await Promise.all([
        listBlogPage(options.limit, options.offset),
        countBlog()
      ]);

      return {
        entries: entries.map(mapBlogPostToContentEntry),
        total
      };
    },
    async getEntry(type, slug) {
      if (type === "news") {
        const entry = await getNewsBySlug(slug);
        return entry ? mapNewsItemToContentEntry(entry) : undefined;
      }

      const entry = await getBlogBySlug(slug);
      return entry ? mapBlogPostToContentEntry(entry) : undefined;
    },
    async getAllTags() {
      const topics = await listTopics();

      if (topics.length > 0) {
        return topics.map((topic) => topic.tag);
      }

      const entries = await this.getAllEntries();
      return Array.from(new Set(entries.flatMap((entry) => entry.tags))).sort();
    },
    async getEntriesByTag(tag) {
      const [newsTotal, blogTotal] = await Promise.all([
        countNewsByTag(tag),
        countBlogByTag(tag)
      ]);
      const [newsEntries, blogEntries] = await Promise.all([
        listNewsByTag(tag, Math.max(newsTotal, 1)),
        listBlogByTag(tag, Math.max(blogTotal, 1))
      ]);

      return sortEntries([
        ...newsEntries.map(mapNewsItemToContentEntry),
        ...blogEntries.map(mapBlogPostToContentEntry)
      ]);
    },
    async getEntriesByTagPage(tag, options) {
      const [newsTotal, blogTotal] = await Promise.all([
        countNewsByTag(tag),
        countBlogByTag(tag)
      ]);
      const [newsEntries, blogEntries] = await Promise.all([
        listNewsByTag(tag, Math.max(newsTotal, 1)),
        listBlogByTag(tag, Math.max(blogTotal, 1))
      ]);
      const entries = sortEntries([
        ...newsEntries.map(mapNewsItemToContentEntry),
        ...blogEntries.map(mapBlogPostToContentEntry)
      ]);

      return {
        entries: entries.slice(options.offset, options.offset + options.limit),
        total: entries.length
      };
    },
    async getTopic(tag) {
      const topic = await getTopicByTag(tag);
      return topic
        ? {
            tag: topic.tag,
            title: topic.title,
            description: topic.description
          }
        : null;
    }
  };
}

export async function getContentRepository(): Promise<ContentRepository> {
  const env = getEnv();

  if (isBuildPhase()) {
    return createEmptyContentRepository();
  }

  if (!hasConfiguredDatabaseUrl()) {
    if (env.NODE_ENV !== "production" && env.LOCAL_PREVIEW_CONTENT) {
      return createPreviewContentRepository();
    }

    return createEmptyContentRepository();
  }

  const databaseAvailability = await getDatabaseAvailability();

  if (databaseAvailability.ok) {
    if (!(await hasPublishedContent())) {
      console.warn("[content] Database is available but has no published entries.");
      return createEmptyContentRepository();
    }

    return createDatabaseContentRepository();
  }

  if (env.NODE_ENV === "production") {
    if (isBuildPhase()) {
      console.warn("[content] Database is unreachable during build. Returning empty content repository for prerender.");
      return createEmptyContentRepository();
    }

    console.error("[content] Database is unreachable during runtime. Returning empty content repository.");
    return createEmptyContentRepository();
  }

  if (env.LOCAL_PREVIEW_CONTENT) {
    console.warn("[content] Database is configured but unreachable. Returning empty content set in development.");
  }

  return createEmptyContentRepository();
}
