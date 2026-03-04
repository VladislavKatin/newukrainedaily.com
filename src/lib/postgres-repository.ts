import "server-only";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";

export type SourceRecord = {
  id: string;
  name: string;
  type: "rss" | "web";
  url: string;
  isActive: boolean;
  createdAt: string;
};

export type NewsRawRecord = {
  id: string;
  sourceId: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  url: string;
  canonicalUrl?: string | null;
  title: string;
  contentSnippet: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  hash: string;
};

export type NewsItemRecord = {
  id: string;
  rawId: string | null;
  slug: string;
  title: string;
  dek: string | null;
  summary: string | null;
  content: string | null;
  keyPoints: unknown;
  whyItMatters: string | null;
  tags: string[];
  topics: string[];
  entities: string[];
  coverImageUrl: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  canonicalUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  readingTimeMinutes: number | null;
  wordCount: number | null;
  charCount: number | null;
  internalLinks: unknown;
  relatedIds: string[];
  fingerprint: string | null;
  isDuplicate: boolean;
  qualityScore: number | null;
  primaryTopic: string | null;
  location: string | null;
  scheduledAt: string | null;
  indexable: boolean;
  status: "draft" | "published";
  language: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  tags: string[];
  coverImageUrl: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  canonicalUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  readingTimeMinutes: number | null;
  wordCount: number | null;
  charCount: number | null;
  primaryTopic: string | null;
  indexable: boolean;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsImageRecord = {
  id: string;
  newsItemId: string;
  provider: string;
  prompt: string;
  generationId: string | null;
  status: "pending" | "requested" | "complete" | "failed";
  attempts: number;
  lastError: string | null;
  remoteImageUrl: string | null;
  localPath: string | null;
  localImageUrl: string | null;
  webhookPayload: unknown;
  createdAt: string;
  updatedAt: string;
};

export type TopicRecord = {
  id: string;
  tag: string;
  title: string;
  description: string | null;
  updatedAt: string;
};

export type JobRecord = {
  id: string;
  type: "daily_generate" | "fetch" | "select_candidates" | "rewrite" | "image" | "link" | "publish" | "autopost";
  payload: unknown;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  attempts: number;
  lastError: string | null;
  runAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceStatusCounts = {
  total: number;
  active: number;
  rssActive: number;
  webActive: number;
};

export type ContentStatusCounts = {
  draft: number;
  published: number;
  total: number;
};

export type OperationalStatusSnapshot = {
  sources: SourceStatusCounts;
  newsRawTotal: number;
  newsItems: ContentStatusCounts;
  blogPosts: ContentStatusCounts;
  newsImages: Record<NewsImageRecord["status"], number>;
  jobs: Record<JobRecord["status"], number>;
};

type CreateRawNewsInput = {
  sourceId?: string | null;
  url: string;
  canonicalUrl?: string | null;
  title: string;
  contentSnippet?: string | null;
  publishedAt?: string | null;
  hash: string;
};

type UpsertNewsItemInput = {
  rawId?: string | null;
  slug: string;
  title: string;
  dek?: string | null;
  summary?: string | null;
  content?: string | null;
  keyPoints?: unknown;
  whyItMatters?: string | null;
  tags?: string[];
  topics?: string[];
  entities?: string[];
  coverImageUrl?: string | null;
  ogImageUrl?: string | null;
  ogImageAlt?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  canonicalUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  readingTimeMinutes?: number | null;
  wordCount?: number | null;
  charCount?: number | null;
  internalLinks?: unknown;
  relatedIds?: string[];
  fingerprint?: string | null;
  isDuplicate?: boolean;
  qualityScore?: number | null;
  primaryTopic?: string | null;
  location?: string | null;
  scheduledAt?: string | null;
  indexable?: boolean;
  status?: "draft" | "published";
  language?: string;
  publishedAt?: string | null;
};

type CreateBlogPostInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  tags?: string[];
  coverImageUrl?: string | null;
  status?: "draft" | "published";
  publishedAt?: string | null;
};

type UpsertTopicInput = {
  tag: string;
  title: string;
  description?: string | null;
};

type EnqueueJobInput = {
  type: JobRecord["type"];
  payload?: unknown;
  status?: JobRecord["status"];
  attempts?: number;
  lastError?: string | null;
  runAt?: string | Date;
};

function normalizeTimestampInput(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

type UpdateJobInput = {
  status?: JobRecord["status"];
  attempts?: number;
  lastError?: string | null;
  payload?: unknown;
};

function mapNewsRaw(row: Record<string, unknown>): NewsRawRecord {
  return {
    id: String(row.id),
    sourceId: row.source_id ? String(row.source_id) : null,
    sourceName: row.source_name ? String(row.source_name) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    url: String(row.url),
    canonicalUrl: row.canonical_url ? String(row.canonical_url) : null,
    title: String(row.title),
    contentSnippet: row.content_snippet ? String(row.content_snippet) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    fetchedAt: String(row.fetched_at),
    hash: String(row.hash)
  };
}

function mapNewsItem(row: Record<string, unknown>): NewsItemRecord {
  return {
    id: String(row.id),
    rawId: row.raw_id ? String(row.raw_id) : null,
    slug: String(row.slug),
    title: String(row.title),
    dek: row.dek ? String(row.dek) : null,
    summary: row.summary ? String(row.summary) : null,
    content: row.content ? String(row.content) : null,
    keyPoints: row.key_points,
    whyItMatters: row.why_it_matters ? String(row.why_it_matters) : null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    topics: Array.isArray(row.topics) ? (row.topics as string[]) : [],
    entities: Array.isArray(row.entities) ? (row.entities as string[]) : [],
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    ogImageUrl: row.og_image_url ? String(row.og_image_url) : null,
    ogImageAlt: row.og_image_alt ? String(row.og_image_alt) : null,
    sourceName: row.source_name ? String(row.source_name) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    canonicalUrl: row.canonical_url ? String(row.canonical_url) : null,
    metaTitle: row.meta_title ? String(row.meta_title) : null,
    metaDescription: row.meta_description ? String(row.meta_description) : null,
    readingTimeMinutes:
      typeof row.reading_time_minutes === "number" ? Number(row.reading_time_minutes) : row.reading_time_minutes ? Number(row.reading_time_minutes) : null,
    wordCount: typeof row.word_count === "number" ? Number(row.word_count) : row.word_count ? Number(row.word_count) : null,
    charCount: typeof row.char_count === "number" ? Number(row.char_count) : row.char_count ? Number(row.char_count) : null,
    internalLinks: row.internal_links ?? [],
    relatedIds: Array.isArray(row.related_ids) ? (row.related_ids as string[]) : [],
    fingerprint: row.fingerprint ? String(row.fingerprint) : null,
    isDuplicate: Boolean(row.is_duplicate),
    qualityScore: row.quality_score === null || row.quality_score === undefined ? null : Number(row.quality_score),
    primaryTopic: row.primary_topic ? String(row.primary_topic) : null,
    location: row.location ? String(row.location) : null,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    indexable: row.indexable === undefined ? true : Boolean(row.indexable),
    status: row.status as NewsItemRecord["status"],
    language: String(row.language),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapBlogPost(row: Record<string, unknown>): BlogPostRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: row.excerpt ? String(row.excerpt) : null,
    body: String(row.body),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    ogImageUrl: row.og_image_url ? String(row.og_image_url) : null,
    ogImageAlt: row.og_image_alt ? String(row.og_image_alt) : null,
    canonicalUrl: row.canonical_url ? String(row.canonical_url) : null,
    metaTitle: row.meta_title ? String(row.meta_title) : null,
    metaDescription: row.meta_description ? String(row.meta_description) : null,
    readingTimeMinutes:
      typeof row.reading_time_minutes === "number" ? Number(row.reading_time_minutes) : row.reading_time_minutes ? Number(row.reading_time_minutes) : null,
    wordCount: typeof row.word_count === "number" ? Number(row.word_count) : row.word_count ? Number(row.word_count) : null,
    charCount: typeof row.char_count === "number" ? Number(row.char_count) : row.char_count ? Number(row.char_count) : null,
    primaryTopic: row.primary_topic ? String(row.primary_topic) : null,
    indexable: row.indexable === undefined ? true : Boolean(row.indexable),
    status: row.status as BlogPostRecord["status"],
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapTopic(row: Record<string, unknown>): TopicRecord {
  return {
    id: String(row.id),
    tag: String(row.tag),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    updatedAt: String(row.updated_at)
  };
}

function mapSource(row: Record<string, unknown>): SourceRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as SourceRecord["type"],
    url: String(row.url).replace(/\s+/g, "").trim(),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at)
  };
}

function mapJob(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    type: row.type as JobRecord["type"],
    payload: row.payload,
    status: row.status as JobRecord["status"],
    attempts: Number(row.attempts),
    lastError: row.last_error ? String(row.last_error) : null,
    runAt: String(row.run_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapNewsImage(row: Record<string, unknown>): NewsImageRecord {
  return {
    id: String(row.id),
    newsItemId: String(row.news_item_id),
    provider: String(row.provider),
    prompt: String(row.prompt),
    generationId: row.generation_id ? String(row.generation_id) : null,
    status: row.status as NewsImageRecord["status"],
    attempts: Number(row.attempts),
    lastError: row.last_error ? String(row.last_error) : null,
    remoteImageUrl: row.remote_image_url ? String(row.remote_image_url) : null,
    localPath: row.local_path ? String(row.local_path) : null,
    localImageUrl: row.local_image_url ? String(row.local_image_url) : null,
    webhookPayload: row.webhook_payload ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function runClientQuery<T extends Record<string, unknown>>(
  client: PoolClient | null,
  text: string,
  values: unknown[]
) {
  if (client) {
    return client.query<T>(text, values);
  }

  return query<T>(text, values);
}

export async function createRawNews(input: CreateRawNewsInput) {
  const result = await query(
    `
      insert into news_raw (source_id, url, canonical_url, title, content_snippet, published_at, hash)
      select $1, $2, $3, $4, $5, $6, $7
      where not exists (
        select 1
        from news_raw
        where url = $2 or hash = $7 or ($3 is not null and canonical_url = $3)
      )
      returning *
    `,
    [
      input.sourceId ?? null,
      input.url,
      input.canonicalUrl ?? null,
      input.title,
      input.contentSnippet ?? null,
      normalizeTimestampInput(input.publishedAt),
      input.hash
    ]
  );

  if (!result.rows[0]) {
    return null;
  }

  return mapNewsRaw(result.rows[0]);
}

export async function listActiveSources(limit = 50) {
  const result = await query(
    `
      with ranked_sources as (
        select
          *,
          regexp_replace(lower(url), '\s+', '', 'g') as normalized_url,
          row_number() over (
            partition by regexp_replace(lower(url), '\s+', '', 'g')
            order by created_at asc, id asc
          ) as source_rank
        from sources
        where is_active = true
      )
      select *
      from ranked_sources
      where source_rank = 1
      order by created_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapSource);
}

export async function getSourceStatusCounts(): Promise<SourceStatusCounts> {
  const result = await query<{
    total: string;
    active: string;
    rss_active: string;
    web_active: string;
  }>(
    `
      select
        count(*)::text as total,
        count(*) filter (where is_active = true)::text as active,
        count(*) filter (where is_active = true and type = 'rss')::text as rss_active,
        count(*) filter (where is_active = true and type = 'web')::text as web_active
      from sources
    `
  );

  return {
    total: Number(result.rows[0]?.total ?? "0"),
    active: Number(result.rows[0]?.active ?? "0"),
    rssActive: Number(result.rows[0]?.rss_active ?? "0"),
    webActive: Number(result.rows[0]?.web_active ?? "0")
  };
}

export async function listUnprocessedRawNews(limit = 20) {
  const result = await query(
    `
      select
        nr.*,
        s.name as source_name,
        s.url as source_url
      from news_raw nr
      left join sources s on s.id = nr.source_id
      left join news_items ni on ni.raw_id = nr.id
      where ni.id is null
      order by nr.published_at desc nulls last, nr.fetched_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapNewsRaw);
}

export async function listCandidateRawNews(limit = 20, windowHours = 36) {
  const result = await query(
    `
      select
        nr.*,
        s.name as source_name,
        s.url as source_url
      from news_raw nr
      left join sources s on s.id = nr.source_id
      left join news_items ni on ni.raw_id = nr.id
      where ni.id is null
        and nr.fetched_at >= timezone('utc', now()) - make_interval(hours => $2)
      order by nr.published_at desc nulls last, nr.fetched_at desc
      limit $1
    `,
    [limit, windowHours]
  );

  return result.rows.map(mapNewsRaw);
}

export async function getRawNewsById(id: string) {
  const result = await query(
    `
      select
        nr.*,
        s.name as source_name,
        s.url as source_url
      from news_raw nr
      left join sources s on s.id = nr.source_id
      where nr.id = $1
      limit 1
    `,
    [id]
  );
  return result.rows[0] ? mapNewsRaw(result.rows[0]) : null;
}

export async function countRawNews() {
  const result = await query<{ count: string }>(`select count(*)::text as count from news_raw`);
  return Number(result.rows[0]?.count ?? "0");
}

export async function upsertNewsItem(input: UpsertNewsItemInput) {
  const values = [
    input.rawId ?? null,
    input.slug,
    input.title,
    input.dek ?? null,
    input.summary ?? null,
    input.content ?? null,
    JSON.stringify(input.keyPoints ?? []),
    input.whyItMatters ?? null,
    input.tags ?? [],
    input.topics ?? [],
    input.entities ?? [],
    input.coverImageUrl ?? null,
    input.ogImageUrl ?? null,
    input.ogImageAlt ?? null,
    input.sourceName ?? null,
    input.sourceUrl ?? null,
    input.canonicalUrl ?? null,
    input.metaTitle ?? null,
    input.metaDescription ?? null,
    input.readingTimeMinutes ?? null,
    input.wordCount ?? null,
    input.charCount ?? null,
    JSON.stringify(input.internalLinks ?? []),
    input.relatedIds ?? [],
    input.fingerprint ?? null,
    input.isDuplicate ?? false,
    input.qualityScore ?? null,
    input.primaryTopic ?? null,
    input.location ?? null,
    normalizeTimestampInput(input.scheduledAt),
    input.indexable ?? true,
    input.status ?? "draft",
    input.language ?? "en",
    normalizeTimestampInput(input.publishedAt)
  ];

  if (input.rawId) {
    const existing = await query(`select id from news_items where raw_id = $1 limit 1`, [input.rawId]);

    if (existing.rows[0]?.id) {
      const result = await query(
        `
          update news_items
          set
            raw_id = $2,
            slug = $3,
            title = $4,
            dek = $5,
            summary = $6,
            content = $7,
            key_points = $8::jsonb,
            why_it_matters = $9,
            tags = $10,
            topics = $11,
            entities = $12,
            cover_image_url = $13,
            og_image_url = $14,
            og_image_alt = $15,
            source_name = $16,
            source_url = $17,
            canonical_url = $18,
            meta_title = $19,
            meta_description = $20,
            reading_time_minutes = $21,
            word_count = $22,
            char_count = $23,
            internal_links = $24::jsonb,
            related_ids = $25,
            fingerprint = $26,
            is_duplicate = $27,
            quality_score = $28,
            primary_topic = $29,
            location = $30,
            scheduled_at = $31,
            indexable = $32,
            status = $33,
            language = $34,
            published_at = $35
          where id = $1
          returning *
        `,
        [
          existing.rows[0].id,
          ...values
        ]
      );

      return mapNewsItem(result.rows[0]);
    }
  }

  const result = await query(
    `
      insert into news_items (
        raw_id, slug, title, dek, summary, content, key_points, why_it_matters, tags, topics, entities,
        cover_image_url, og_image_url, og_image_alt, source_name, source_url, canonical_url,
        meta_title, meta_description, reading_time_minutes, word_count, char_count,
        internal_links, related_ids, fingerprint, is_duplicate, quality_score, primary_topic,
        location, scheduled_at, indexable, status, language, published_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23::jsonb, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
      )
      on conflict (slug) do update set
        raw_id = excluded.raw_id,
        title = excluded.title,
        dek = excluded.dek,
        summary = excluded.summary,
        content = excluded.content,
        key_points = excluded.key_points,
        why_it_matters = excluded.why_it_matters,
        tags = excluded.tags,
        topics = excluded.topics,
        entities = excluded.entities,
        cover_image_url = excluded.cover_image_url,
        og_image_url = excluded.og_image_url,
        og_image_alt = excluded.og_image_alt,
        source_name = excluded.source_name,
        source_url = excluded.source_url,
        canonical_url = excluded.canonical_url,
        meta_title = excluded.meta_title,
        meta_description = excluded.meta_description,
        reading_time_minutes = excluded.reading_time_minutes,
        word_count = excluded.word_count,
        char_count = excluded.char_count,
        internal_links = excluded.internal_links,
        related_ids = excluded.related_ids,
        fingerprint = excluded.fingerprint,
        is_duplicate = excluded.is_duplicate,
        quality_score = excluded.quality_score,
        primary_topic = excluded.primary_topic,
        location = excluded.location,
        scheduled_at = excluded.scheduled_at,
        indexable = excluded.indexable,
        status = excluded.status,
        language = excluded.language,
        published_at = excluded.published_at
      returning *
    `,
    values
  );

  return mapNewsItem(result.rows[0]);
}

export async function listNews(limit = 20, status: NewsItemRecord["status"] | "all" = "published") {
  const result = await query(
    `
      select *
      from news_items
      where ($1::text = 'all' or status = $1::content_status)
      order by published_at desc nulls last, created_at desc
      limit $2
    `,
    [status, limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function listRecentPublishedNews(limit = 200) {
  const result = await query(
    `
      select *
      from news_items
      where status = 'published'
      order by published_at desc nulls last, created_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function listNewsPage(
  limit = 20,
  offset = 0,
  status: NewsItemRecord["status"] | "all" = "published"
) {
  const result = await query(
    `
      select *
      from news_items
      where ($1::text = 'all' or status = $1::content_status)
      order by published_at desc nulls last, created_at desc
      limit $2
      offset $3
    `,
    [status, limit, offset]
  );

  return result.rows.map(mapNewsItem);
}

export async function countNews(status: NewsItemRecord["status"] | "all" = "published") {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from news_items
      where ($1::text = 'all' or status = $1::content_status)
    `,
    [status]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function getNewsStatusCounts(): Promise<ContentStatusCounts> {
  const result = await query<{
    draft: string;
    published: string;
    total: string;
  }>(
    `
      select
        count(*) filter (where status = 'draft')::text as draft,
        count(*) filter (where status = 'published')::text as published,
        count(*)::text as total
      from news_items
    `
  );

  return {
    draft: Number(result.rows[0]?.draft ?? "0"),
    published: Number(result.rows[0]?.published ?? "0"),
    total: Number(result.rows[0]?.total ?? "0")
  };
}

export async function getNewsBySlug(slug: string) {
  const result = await query(`select * from news_items where slug = $1 limit 1`, [slug]);
  return result.rows[0] ? mapNewsItem(result.rows[0]) : null;
}

export async function getNewsByTitle(title: string) {
  const result = await query(`select * from news_items where title = $1 limit 1`, [title]);
  return result.rows[0] ? mapNewsItem(result.rows[0]) : null;
}

export async function getNewsByRawId(rawId: string) {
  const result = await query(`select * from news_items where raw_id = $1 limit 1`, [rawId]);
  return result.rows[0] ? mapNewsItem(result.rows[0]) : null;
}

export async function listNewsByTag(tag: string, limit = 20) {
  const result = await query(
    `
      select *
      from news_items
      where status = 'published' and tags @> array[$1]::text[]
      order by published_at desc nulls last, created_at desc
      limit $2
    `,
    [tag, limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function countNewsByTag(tag: string) {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from news_items
      where status = 'published' and tags @> array[$1]::text[]
    `,
    [tag]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function listDraftNewsWithoutImages(limit = 20) {
  const result = await query(
    `
      select *
      from news_items
      where status = 'draft'
        and (cover_image_url is null or og_image_url is null)
      order by created_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function listNewsItemsNeedingImageGeneration(
  limit = 10,
  maxAttempts = 3
) {
  const result = await query(
    `
      select ni.*
      from news_items ni
      left join news_images img on img.news_item_id = ni.id
      where ni.status = 'draft'
        and ni.cover_image_url is null
        and (
          img.id is null
          or (
            img.status = 'failed'
            and img.attempts < $2
          )
          or (
            img.status = 'pending'
            and img.attempts < $2
          )
          or (
            img.status = 'requested'
          )
        )
      order by ni.created_at asc
      limit $1
    `,
    [limit, maxAttempts]
  );

  return result.rows.map(mapNewsItem);
}

export async function listDraftNewsForPublish(limit = 20) {
  const result = await query(
    `
      select *
      from news_items
      where status = 'draft'
      order by created_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function listPublishReadyNews(limit = 20) {
  const result = await query(
    `
      select *
      from news_items
      where status = 'draft'
        and coalesce(nullif(trim(title), ''), null) is not null
        and coalesce(nullif(trim(summary), ''), null) is not null
        and coalesce(nullif(trim(dek), ''), null) is not null
        and coalesce(nullif(trim(why_it_matters), ''), null) is not null
        and char_length(trim(summary)) >= 180
        and char_length(trim(why_it_matters)) >= 80
        and coalesce(nullif(trim(source_name), ''), null) is not null
        and coalesce(nullif(trim(source_url), ''), null) is not null
        and array_length(tags, 1) is not null
        and array_length(tags, 1) >= 3
        and jsonb_typeof(key_points) = 'array'
        and jsonb_array_length(key_points) >= 3
        and cover_image_url is not null
        and og_image_url is not null
      order by published_at asc nulls last, created_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapNewsItem);
}

export async function countPublishedNewsSince(sinceIso: string) {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from news_items
      where status = 'published'
        and published_at is not null
        and published_at >= $1::timestamptz
    `,
    [sinceIso]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function updateNewsItemAssets(
  id: string,
  input: { coverImageUrl?: string | null; ogImageUrl?: string | null }
) {
  const result = await query(
    `
      update news_items
      set
        cover_image_url = coalesce($2, cover_image_url),
        og_image_url = coalesce($3, og_image_url)
      where id = $1
      returning *
    `,
    [id, input.coverImageUrl ?? null, input.ogImageUrl ?? null]
  );

  return result.rows[0] ? mapNewsItem(result.rows[0]) : null;
}

export async function upsertNewsImageRequest(input: {
  newsItemId: string;
  prompt: string;
  provider?: string;
  generationId?: string | null;
  status: NewsImageRecord["status"];
  attempts: number;
  lastError?: string | null;
}) {
  const result = await query(
    `
      insert into news_images (
        news_item_id, provider, prompt, generation_id, status, attempts, last_error
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (news_item_id) do update set
        provider = excluded.provider,
        prompt = excluded.prompt,
        generation_id = excluded.generation_id,
        status = excluded.status,
        attempts = excluded.attempts,
        last_error = excluded.last_error
      returning *
    `,
    [
      input.newsItemId,
      input.provider ?? "leonardo",
      input.prompt,
      input.generationId ?? null,
      input.status,
      input.attempts,
      input.lastError ?? null
    ]
  );

  return mapNewsImage(result.rows[0]);
}

export async function getNewsImageByNewsItemId(newsItemId: string) {
  const result = await query(`select * from news_images where news_item_id = $1 limit 1`, [
    newsItemId
  ]);
  return result.rows[0] ? mapNewsImage(result.rows[0]) : null;
}

export async function getNewsImageByGenerationId(generationId: string) {
  const result = await query(`select * from news_images where generation_id = $1 limit 1`, [
    generationId
  ]);
  return result.rows[0] ? mapNewsImage(result.rows[0]) : null;
}

export async function completeNewsImage(input: {
  generationId: string;
  remoteImageUrl: string;
  localPath: string;
  localImageUrl: string;
  webhookPayload: unknown;
}) {
  const result = await query(
    `
      update news_images
      set
        status = 'complete',
        remote_image_url = $2,
        local_path = $3,
        local_image_url = $4,
        webhook_payload = $5::jsonb,
        last_error = null
      where generation_id = $1
      returning *
    `,
    [
      input.generationId,
      input.remoteImageUrl,
      input.localPath,
      input.localImageUrl,
      JSON.stringify(input.webhookPayload)
    ]
  );

  return result.rows[0] ? mapNewsImage(result.rows[0]) : null;
}

export async function failNewsImage(input: {
  newsItemId?: string;
  generationId?: string;
  attempts?: number;
  error: string;
  webhookPayload?: unknown;
}) {
  const result = await query(
    `
      update news_images
      set
        status = 'failed',
        attempts = coalesce($3, attempts),
        last_error = $4,
        webhook_payload = coalesce($5::jsonb, webhook_payload)
      where (
        ($1::uuid is not null and news_item_id = $1::uuid)
        or ($2::text is not null and generation_id = $2::text)
      )
      returning *
    `,
    [
      input.newsItemId ?? null,
      input.generationId ?? null,
      input.attempts ?? null,
      input.error,
      input.webhookPayload === undefined ? null : JSON.stringify(input.webhookPayload)
    ]
  );

  return result.rows[0] ? mapNewsImage(result.rows[0]) : null;
}

export async function publishNewsItem(id: string, publishedAt = new Date().toISOString()) {
  const result = await query(
    `
      update news_items
      set
        status = 'published',
        published_at = coalesce(published_at, $2)
      where id = $1
      returning *
    `,
    [id, publishedAt]
  );

  return result.rows[0] ? mapNewsItem(result.rows[0]) : null;
}

export async function createBlogPost(input: CreateBlogPostInput) {
  const result = await query(
    `
      insert into blog_posts (slug, title, excerpt, body, tags, cover_image_url, status, published_at)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (slug) do update set
        title = excluded.title,
        excerpt = excluded.excerpt,
        body = excluded.body,
        tags = excluded.tags,
        cover_image_url = excluded.cover_image_url,
        status = excluded.status,
        published_at = excluded.published_at
      returning *
    `,
    [
      input.slug,
      input.title,
      input.excerpt ?? null,
      input.body,
      input.tags ?? [],
      input.coverImageUrl ?? null,
      input.status ?? "draft",
      normalizeTimestampInput(input.publishedAt)
    ]
  );

  return mapBlogPost(result.rows[0]);
}

export async function listBlog(limit = 20, status: BlogPostRecord["status"] | "all" = "published") {
  const result = await query(
    `
      select *
      from blog_posts
      where ($1::text = 'all' or status = $1::content_status)
      order by published_at desc nulls last, created_at desc
      limit $2
    `,
    [status, limit]
  );

  return result.rows.map(mapBlogPost);
}

export async function listBlogPage(
  limit = 20,
  offset = 0,
  status: BlogPostRecord["status"] | "all" = "published"
) {
  const result = await query(
    `
      select *
      from blog_posts
      where ($1::text = 'all' or status = $1::content_status)
      order by published_at desc nulls last, created_at desc
      limit $2
      offset $3
    `,
    [status, limit, offset]
  );

  return result.rows.map(mapBlogPost);
}

export async function countBlog(status: BlogPostRecord["status"] | "all" = "published") {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from blog_posts
      where ($1::text = 'all' or status = $1::content_status)
    `,
    [status]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function getBlogStatusCounts(): Promise<ContentStatusCounts> {
  const result = await query<{
    draft: string;
    published: string;
    total: string;
  }>(
    `
      select
        count(*) filter (where status = 'draft')::text as draft,
        count(*) filter (where status = 'published')::text as published,
        count(*)::text as total
      from blog_posts
    `
  );

  return {
    draft: Number(result.rows[0]?.draft ?? "0"),
    published: Number(result.rows[0]?.published ?? "0"),
    total: Number(result.rows[0]?.total ?? "0")
  };
}

export async function getBlogBySlug(slug: string) {
  const result = await query(`select * from blog_posts where slug = $1 limit 1`, [slug]);
  return result.rows[0] ? mapBlogPost(result.rows[0]) : null;
}

export async function listBlogByTag(tag: string, limit = 20) {
  const result = await query(
    `
      select *
      from blog_posts
      where status = 'published' and tags @> array[$1]::text[]
      order by published_at desc nulls last, created_at desc
      limit $2
    `,
    [tag, limit]
  );

  return result.rows.map(mapBlogPost);
}

export async function countBlogByTag(tag: string) {
  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from blog_posts
      where status = 'published' and tags @> array[$1]::text[]
    `,
    [tag]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function upsertTopic(input: UpsertTopicInput) {
  const result = await query(
    `
      insert into topics (tag, title, description)
      values ($1, $2, $3)
      on conflict (tag) do update set
        title = excluded.title,
        description = excluded.description,
        updated_at = timezone('utc', now())
      returning *
    `,
    [input.tag, input.title, input.description ?? null]
  );

  return mapTopic(result.rows[0]);
}

export async function listTopics(limit = 100) {
  const result = await query(
    `
      select *
      from topics
      order by tag asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapTopic);
}

export async function getTopicByTag(tag: string) {
  const result = await query(`select * from topics where tag = $1 limit 1`, [tag]);
  return result.rows[0] ? mapTopic(result.rows[0]) : null;
}

export async function getNextFreeTopic() {
  const result = await query(
    `
      select t.*
      from topics t
      where not exists (
        select 1
        from jobs j
        where j.status in ('pending', 'running')
          and coalesce(j.payload ->> 'topicTag', '') = t.tag
      )
      order by t.updated_at asc, t.tag asc
      limit 1
    `
  );

  return result.rows[0] ? mapTopic(result.rows[0]) : null;
}

export async function enqueueJob(input: EnqueueJobInput, client: PoolClient | null = null) {
  const result = await runClientQuery<Record<string, unknown>>(
    client,
    `
      insert into jobs (type, payload, status, attempts, last_error, run_at)
      values ($1, $2::jsonb, $3, $4, $5, $6)
      returning *
    `,
    [
      input.type,
      JSON.stringify(input.payload ?? {}),
      input.status ?? "pending",
      input.attempts ?? 0,
      input.lastError ?? null,
      normalizeTimestampInput(input.runAt) ?? new Date().toISOString()
    ]
  );

  return mapJob(result.rows[0]);
}

export async function listPendingJobs(limit = 50) {
  const result = await query(
    `
      select *
      from jobs
      where status in ('pending', 'running')
      order by run_at asc
      limit $1
    `,
    [limit]
  );

  return result.rows.map(mapJob);
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const result = await query(
    `
      update jobs
      set
        status = coalesce($2, status),
        attempts = coalesce($3, attempts),
        last_error = $4,
        payload = coalesce($5::jsonb, payload)
      where id = $1
      returning *
    `,
    [
      id,
      input.status ?? null,
      input.attempts ?? null,
      input.lastError ?? null,
      input.payload === undefined ? null : JSON.stringify(input.payload)
    ]
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function getNewsImageStatusCounts(): Promise<Record<NewsImageRecord["status"], number>> {
  const result = await query<{ status: NewsImageRecord["status"]; count: string }>(
    `
      select status, count(*)::text as count
      from news_images
      group by status
    `
  );

  const counts: Record<NewsImageRecord["status"], number> = {
    pending: 0,
    requested: 0,
    complete: 0,
    failed: 0
  };

  for (const row of result.rows) {
    counts[row.status] = Number(row.count);
  }

  return counts;
}

export async function getJobStatusCounts(): Promise<Record<JobRecord["status"], number>> {
  const result = await query<{ status: JobRecord["status"]; count: string }>(
    `
      select status, count(*)::text as count
      from jobs
      group by status
    `
  );

  const counts: Record<JobRecord["status"], number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  };

  for (const row of result.rows) {
    counts[row.status] = Number(row.count);
  }

  return counts;
}

export async function getOperationalStatusSnapshot(): Promise<OperationalStatusSnapshot> {
  const [sources, newsRawTotal, newsItems, blogPosts, newsImages, jobs] = await Promise.all([
    getSourceStatusCounts(),
    countRawNews(),
    getNewsStatusCounts(),
    getBlogStatusCounts(),
    getNewsImageStatusCounts(),
    getJobStatusCounts()
  ]);

  return {
    sources,
    newsRawTotal,
    newsItems,
    blogPosts,
    newsImages,
    jobs
  };
}

export async function createRawNewsWithPublishJob(
  rawInput: CreateRawNewsInput,
  jobPayload: unknown = {}
) {
  return withTransaction(async (client) => {
    const rawResult = await runClientQuery<Record<string, unknown>>(
      client,
      `
        insert into news_raw (source_id, url, title, content_snippet, published_at, hash)
        select $1, $2, $3, $4, $5, $6
        where not exists (
          select 1
          from news_raw
          where url = $2 or hash = $6
        )
        returning *
      `,
      [
        rawInput.sourceId ?? null,
        rawInput.url,
        rawInput.title,
        rawInput.contentSnippet ?? null,
        normalizeTimestampInput(rawInput.publishedAt),
        rawInput.hash
      ]
    );

    if (!rawResult.rows[0]) {
      return { raw: null, job: null };
    }

    const raw = mapNewsRaw(rawResult.rows[0]);
    const job = await enqueueJob(
      {
        type: "rewrite",
        payload: {
          rawId: raw.id,
          ...((jobPayload as Record<string, unknown>) ?? {})
        }
      },
      client
    );

    return { raw, job };
  });
}
