import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
loadLocalEnv(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const BASE_URL = (process.env.PUBLIC_BASE_URL || "https://www.newukrainedaily.com").replace(/\/+$/, "");
const TARGET_BLOG_POSTS = Number(process.env.BLOG_TARGET_POSTS || 24);

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
}

function clamp(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function buildBody(row) {
  const title = String(row.title || "Ukraine Support Insight");
  const summary = String(row.summary || row.dek || "").trim();
  const content = String(row.content || summary).trim();
  const why = String(row.why_it_matters || "").trim();
  const sourceUrl = String(row.source_url || `${BASE_URL}/news/${row.slug}`);

  return [
    "## Editorial Overview",
    `${title} reflects a practical trend in Ukraine support coverage: readers are increasingly focused on measurable outcomes, not only urgent headlines. This post translates key points into a structured editorial view for long-term context.`,
    summary || "This update highlights how support decisions can be made with clearer priorities and accountability.",
    "",
    "## What This Means for Ongoing Support",
    content ||
      "The core signal is continuity. Reliable support models make planning easier for organizations and reduce operational volatility in essential services.",
    "",
    "## Why It Matters",
    why ||
      "Long-cycle support requires consistency, transparent reporting, and realistic expectations about delivery timelines.",
    "",
    "## Practical Reading Note",
    "When evaluating support coverage, prioritize sources that describe execution steps, known constraints, and updates over time. That combination makes content more useful for real decisions.",
    "",
    "## Source",
    `Original reporting: ${sourceUrl}`
  ].join("\n\n");
}

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3
  });

  try {
    const current = await pool.query(
      "select count(*)::int as c from blog_posts where status = 'published'"
    );
    const currentCount = Number(current.rows[0]?.c || 0);

    if (currentCount >= TARGET_BLOG_POSTS) {
      console.log(
        `[backfill-blog-from-news] already enough posts: ${currentCount}/${TARGET_BLOG_POSTS}`
      );
      return;
    }

    const need = TARGET_BLOG_POSTS - currentCount;
    const news = await pool.query(
      `
        select slug, title, dek, summary, content, why_it_matters, tags,
               generated_image_url, preview_image_url, og_image_url, source_url, published_at
        from news_items
        where status = 'published'
        order by published_at desc nulls last
        limit $1
      `,
      [Math.max(need * 3, 40)]
    );

    let created = 0;
    for (const row of news.rows) {
      if (created >= need) break;
      const slug = `insight-${String(row.slug)}`;
      const title = clamp(`Editorial Insight: ${String(row.title || "")}`, 120);

      const exists = await pool.query(
        "select 1 from blog_posts where slug = $1 limit 1",
        [slug]
      );
      if (exists.rowCount > 0) continue;

      const excerpt = clamp(
        String(row.summary || row.dek || "Editorial analysis and context on Ukraine support developments."),
        170
      );
      const body = buildBody(row);
      const tags = Array.isArray(row.tags) ? row.tags.map(String).slice(0, 8) : ["ukraine-support"];
      if (!tags.includes("blog")) tags.push("blog");
      const cover =
        row.generated_image_url || row.preview_image_url || row.og_image_url || null;
      const publishedAt = row.published_at || new Date().toISOString();

      await pool.query(
        `
          insert into blog_posts (
            slug, title, excerpt, body, tags, cover_image_url,
            og_image_url, og_image_alt, canonical_url, meta_title, meta_description,
            status, published_at, updated_at
          )
          values (
            $1, $2, $3, $4, $5::text[], $6,
            $7, $8, $9, $10, $11,
            'published', $12, timezone('utc', now())
          )
        `,
        [
          slug,
          title,
          excerpt,
          body,
          tags,
          cover,
          cover,
          `Editorial cover image for ${title}`,
          `${BASE_URL}/blog/${slug}`,
          clamp(`${title} | NewUkraineDaily`, 70),
          clamp(excerpt, 160),
          publishedAt
        ]
      );

      created += 1;
      console.log(`[backfill-blog-from-news] created ${created}/${need}: ${slug}`);
    }

    console.log(
      `[backfill-blog-from-news] done. created=${created}, target=${TARGET_BLOG_POSTS}, before=${currentCount}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[backfill-blog-from-news] failed:", error);
  process.exit(1);
});
