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

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 4
});

const CANONICAL_TAGS = new Map([
  ["ukraine", "ukraine"],
  ["ukraine conflict", "war"],
  ["ukrainian", "ukraine"],
  ["russia", "russia"],
  ["energy", "energy"],
  ["infrastructure", "infrastructure"],
  ["diplomacy", "diplomacy"],
  ["peace talks", "peace talks"],
  ["negotiations", "peace talks"],
  ["defense", "security"],
  ["iran", "iran"],
  ["us", "us"],
  ["volodymyr zelenskyy", "zelenskyy"],
  ["donald trump", "donald trump"]
]);

const NOISY_TAGS = new Set([
  "astrology",
  "horoscope",
  "cooking",
  "blackcurrants",
  "fertilization",
  "cultural beliefs",
  "ergonomics",
  "march 8",
  "leo"
]);

function normalizeTag(tag) {
  const normalized = String(tag || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (NOISY_TAGS.has(normalized)) {
    return null;
  }

  return CANONICAL_TAGS.get(normalized) || normalized;
}

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function backup() {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `taxonomy-backup-${stamp}.json`);

  const [topics, news, blog] = await Promise.all([
    pool.query(`select * from topics order by tag asc`),
    pool.query(`select id, slug, tags, topics, primary_topic from news_items order by created_at desc`),
    pool.query(`select id, slug, tags, primary_topic from blog_posts order by created_at desc`)
  ]);

  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        topics: topics.rows,
        newsItems: news.rows,
        blogPosts: blog.rows
      },
      null,
      2
    )
  );

  return backupPath;
}

async function normalizeNewsItems() {
  const { rows } = await pool.query(`
    select id, slug, tags, topics, primary_topic
    from news_items
  `);

  let updated = 0;

  for (const row of rows) {
    const nextTags = dedupe((row.tags || []).map(normalizeTag));
    const nextTopics = dedupe((row.topics || []).map(normalizeTag));
    const nextPrimary = normalizeTag(row.primary_topic) || nextTopics[0] || nextTags[0] || "world";

    await pool.query(
      `
        update news_items
        set tags = $2::text[],
            topics = $3::text[],
            primary_topic = $4,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [row.id, nextTags, nextTopics, nextPrimary]
    );

    updated += 1;
  }

  return updated;
}

async function normalizeBlogPosts() {
  const { rows } = await pool.query(`
    select id, slug, tags, primary_topic
    from blog_posts
  `);

  let updated = 0;

  for (const row of rows) {
    const nextTags = dedupe((row.tags || []).map(normalizeTag));
    const nextPrimary = normalizeTag(row.primary_topic) || nextTags[0] || "world";

    await pool.query(
      `
        update blog_posts
        set tags = $2::text[],
            primary_topic = $3,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [row.id, nextTags, nextPrimary]
    );

    updated += 1;
  }

  return updated;
}

async function rebuildTopics() {
  await pool.query(`delete from topics`);

  const { rows } = await pool.query(`
    select distinct unnest(tags) as tag
    from news_items
    where status = 'published'
    union
    select distinct unnest(tags) as tag
    from blog_posts
    where status = 'published'
  `);

  let inserted = 0;
  for (const row of rows) {
    const normalized = normalizeTag(row.tag);
    if (!normalized) {
      continue;
    }

    const title = normalized
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    await pool.query(
      `
        insert into topics (tag, title, description, updated_at)
        values ($1, $2, $3, timezone('utc', now()))
        on conflict (tag) do update set
          title = excluded.title,
          description = excluded.description,
          updated_at = timezone('utc', now())
      `,
      [normalized, title, `${title} coverage, background, and related reporting from New Ukraine Daily.`]
    );

    inserted += 1;
  }

  return inserted;
}

async function main() {
  try {
    const backupPath = await backup();
    const updatedNews = await normalizeNewsItems();
    const updatedBlogs = await normalizeBlogPosts();
    const topicCount = await rebuildTopics();
    console.log(
      `[normalize-taxonomy] backup=${backupPath} updatedNews=${updatedNews} updatedBlogs=${updatedBlogs} rebuiltTopics=${topicCount}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[normalize-taxonomy] failed:", error);
  process.exitCode = 1;
});
