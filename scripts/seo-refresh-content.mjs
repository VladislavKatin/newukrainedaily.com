import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;

loadLocalEnv(process.cwd());

for (const fileName of [".env.vercel.prod"]) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");

    process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");
}

const baseUrl = (process.env.PUBLIC_BASE_URL || "https://www.newukrainedaily.com").replace(/\/+$/, "");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5
});

function clamp(text, max) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return normalized.slice(0, Math.max(1, max - 1)).trim() + "…";
}

function textStats(input) {
  const normalized = (input || "").replace(/\s+/g, " ").trim();
  const words = normalized ? normalized.split(" ").length : 0;
  const chars = normalized.length;
  const reading = Math.max(1, Math.ceil(words / 220));
  return { words, chars, reading };
}

function uniq(items) {
  return Array.from(new Set((items || []).map((item) => String(item).trim()).filter(Boolean)));
}

function overlapCount(a, b) {
  const setA = new Set(a.map((item) => item.toLowerCase()));
  const setB = new Set(b.map((item) => item.toLowerCase()));
  let overlap = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      overlap += 1;
    }
  }
  return overlap;
}

function buildRelated(current, allPublished) {
  const currentTokens = uniq([...(current.tags || []), ...(current.topics || []), ...(current.entities || []), current.primary_topic]);
  const scored = allPublished
    .filter((item) => item.id !== current.id)
    .map((item) => {
      const tokens = uniq([...(item.tags || []), ...(item.topics || []), ...(item.entities || []), item.primary_topic]);
      return { item, score: overlapCount(currentTokens, tokens) };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return new Date(b.item.published_at || b.item.created_at).getTime() - new Date(a.item.published_at || a.item.created_at).getTime();
    });

  const primary = scored.filter(({ score }) => score > 0).slice(0, 5);
  const fallback = scored
    .filter(({ item }) => !primary.some((entry) => entry.item.id === item.id))
    .slice(0, Math.max(0, 5 - primary.length));
  const related = [...primary, ...fallback].slice(0, 5).map(({ item }, index) => ({
    id: item.id,
    type: "article",
    href: "/news/" + item.slug,
    title: item.title,
    anchor:
      ["related coverage", "earlier reporting", "latest reporting", "recent updates", "previous coverage"][index] ||
      item.title
  }));

  const topic = current.primary_topic || current.topics?.[0] || current.tags?.[0] || "World";
  const topicSlug = String(topic).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "world";

  const links = [
    {
      type: "topic",
      href: "/topic/" + topicSlug,
      title: topic,
      anchor: "more on this topic"
    },
    ...related
  ].slice(0, 7);

  return {
    links,
    relatedIds: related.map((entry) => entry.id).filter(Boolean)
  };
}

async function refreshNews() {
  const published = await pool.query(
    `
      select *
      from news_items
      where status = 'published'
      order by published_at desc nulls last, created_at desc
    `
  );

  let updated = 0;

  for (const row of published.rows) {
    const title = String(row.title || "").trim();
    const slug = String(row.slug || "").trim();
    const tags = uniq(row.tags || []);
    const topics = uniq(row.topics || []);
    const entities = uniq(row.entities || []);
    const primaryTopic = row.primary_topic || topics[0] || tags[0] || "World";

    const content = String(row.content || row.summary || row.dek || "").trim();
    const summary = String(row.summary || row.dek || "").trim();
    const dek = String(row.dek || summary).trim();
    const stats = textStats(content || summary || dek || title);

    const descriptionSeed = summary || dek || content || title;
    const metaTitle = clamp(row.meta_title || title, 70);
    const metaDescription = clamp(row.meta_description || descriptionSeed, 160);
    const canonicalUrl = row.canonical_url || `${baseUrl}/news/${slug}`;
    const ogImageUrl = row.og_image_url || row.generated_image_url || row.cover_image_url || row.preview_image_url || null;
    const ogImageAlt = row.og_image_alt || row.generated_image_alt || `${title} cover image`;

    const related = buildRelated(row, published.rows);

    await pool.query(
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
          related_ids = (
            select coalesce(array_agg(id), '{}')::uuid[]
            from news_items
            where slug = any($18::text[])
          ),
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        row.id,
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
        stats.reading,
        stats.words,
        stats.chars,
        JSON.stringify(related.links),
        related.relatedIds
      ]
    );

    updated += 1;
  }

  return { total: published.rows.length, updated };
}

async function refreshBlog() {
  const posts = await pool.query(
    `
      select *
      from blog_posts
      where status = 'published'
      order by published_at desc nulls last, created_at desc
    `
  );

  let updated = 0;

  for (const row of posts.rows) {
    const title = String(row.title || "").trim();
    const slug = String(row.slug || "").trim();
    const body = String(row.body || "").trim();
    const excerpt = String(row.excerpt || body || title).trim();
    const stats = textStats(body || excerpt || title);
    const metaTitle = clamp(row.meta_title || title, 70);
    const metaDescription = clamp(row.meta_description || excerpt, 160);
    const canonicalUrl = row.canonical_url || `${baseUrl}/blog/${slug}`;
    const ogImageUrl = row.og_image_url || row.cover_image_url || null;
    const ogImageAlt = row.og_image_alt || `${title} cover image`;

    await pool.query(
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
        row.id,
        excerpt || null,
        metaTitle || null,
        metaDescription || null,
        canonicalUrl,
        ogImageUrl,
        ogImageAlt,
        stats.reading,
        stats.words,
        stats.chars
      ]
    );

    updated += 1;
  }

  return { total: posts.rows.length, updated };
}

async function main() {
  try {
    const [news, blog] = await Promise.all([refreshNews(), refreshBlog()]);
    console.log(`[seo-refresh] news updated=${news.updated}/${news.total}`);
    console.log(`[seo-refresh] blog updated=${blog.updated}/${blog.total}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[seo-refresh] failed:", error);
  process.exitCode = 1;
});
