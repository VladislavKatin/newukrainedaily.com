import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

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
const openAiApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const aiProvider = process.env.AI_PROVIDER || "openai:gpt-4o-mini";

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");
}

if (!openAiApiKey) {
  throw new Error("AI_API_KEY or OPENAI_API_KEY is required.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 4
});

function getModel() {
  const [, configuredModel] = aiProvider.split(":", 2);
  return configuredModel || DEFAULT_MODEL;
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function clamp(value, max) {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function countWords(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function countChars(value) {
  return normalizeText(value).length;
}

function readingTimeMinutes(value) {
  return Math.max(1, Math.ceil(countWords(value) / 220));
}

function slugTitleAnchor(title) {
  const normalized = normalizeText(title);
  const words = normalized.split(/\s+/).slice(0, 6);
  return words.join(" ");
}

function ensureArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return fallback;
}

function improveInternalLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link) => {
      const title = normalizeText(link?.title || "");
      const href = normalizeText(link?.href || "");
      if (!href || !title) {
        return null;
      }

      const anchor =
        link?.type === "topic"
          ? `More on ${title}`
          : title.length <= 58
            ? title
            : slugTitleAnchor(title);

      return {
        type: link?.type === "topic" ? "topic" : "article",
        href,
        title,
        anchor
      };
    })
    .filter(Boolean)
    .slice(0, 7);
}

function buildNewsPrompt(row) {
  return [
    "You are a senior editor improving an existing English-language Ukraine news article.",
    "Your job is to make the text sound human-edited, natural, concise, and newsroom-ready while preserving facts.",
    "Do not invent facts, numbers, quotes, names, dates, or outcomes.",
    "Do not change the factual meaning of the article.",
    "Remove robotic phrasing, repetition, filler transitions, and machine-translated wording.",
    "Use short and medium paragraphs. Make the flow feel like a real edited digital news piece.",
    "Make the change visible in the first screenful: rewrite the dek, summary, and first two body paragraphs so they read more clearly and more naturally.",
    "Keep the tone neutral, credible, and calm.",
    "Preserve SEO value, but avoid keyword stuffing.",
    "Return strict JSON only.",
    "",
    "Output keys:",
    "title, dek, summary, content, why_it_matters, key_points, meta_title, meta_description, og_image_alt",
    "",
    "Constraints:",
    "- title <= 70 chars",
    "- dek 1-2 sentences",
    "- summary 2 short paragraphs maximum, clear and human",
    "- first paragraph should open with the central fact, not background throat-clearing",
    "- second paragraph should add the most relevant consequence, context, or official detail",
    "- content must be natural editorial English with readable paragraph breaks",
    "- why_it_matters 1-2 short paragraphs",
    "- key_points 3-5 concise bullets",
    "- meta_title <= 70 chars",
    "- meta_description 90-160 chars",
    "- og_image_alt should be specific, natural, and not generic",
    "",
    "Do not use these phrases unless absolutely necessary:",
    "in addition, moreover, it is worth noting, this development highlights, as a result of this, it should be emphasized",
    "",
    "Current article fields:",
    JSON.stringify(
      {
        slug: row.slug,
        title: row.title,
        dek: row.dek,
        summary: row.summary,
        content: row.content,
        why_it_matters: row.why_it_matters,
        key_points: row.key_points,
        tags: row.tags,
        topics: row.topics,
        entities: row.entities,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        og_image_alt: row.og_image_alt,
        source_name: row.source_name,
        source_url: row.source_url
      },
      null,
      2
    )
  ].join("\n");
}

function buildBlogPrompt(row) {
  return [
    "You are a senior editor improving an existing English-language blog article about supporting Ukraine.",
    "Make the article sound more human, editorial, and useful, while preserving all factual claims already present.",
    "Do not invent new facts or statistics.",
    "Keep the piece publication-ready, readable on mobile, and structured with clean sections and paragraphs.",
    "Make the improvement noticeable in the opening section and excerpt, so readers immediately feel the article has been edited by a human.",
    "Remove robotic wording, repetition, filler, and weak transitions.",
    "Return strict JSON only.",
    "",
    "Output keys:",
    "title, excerpt, body, meta_title, meta_description, og_image_alt",
    "",
    "Constraints:",
    "- title <= 70 chars",
    "- excerpt 1 short paragraph",
    "- body should keep markdown headings if useful, but feel human-edited and concise",
    "- meta_title <= 70 chars",
    "- meta_description 90-160 chars",
    "- og_image_alt should be natural and descriptive",
    "",
    "Current article fields:",
    JSON.stringify(
      {
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        body: row.body,
        tags: row.tags,
        meta_title: row.meta_title,
        meta_description: row.meta_description,
        og_image_alt: row.og_image_alt
      },
      null,
      2
    )
  ].join("\n");
}

async function callOpenAi(prompt) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a meticulous editor. Rewrite awkward content into natural newsroom English while preserving facts. Output valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${message}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned empty content.");
  }

  return JSON.parse(content);
}

function ensureNewsRewrite(payload, row) {
  const title = clamp(payload.title || row.title, 70);
  const dek = normalizeText(payload.dek || row.dek || row.summary || title);
  const summary = normalizeText(payload.summary || row.summary || dek);
  const content = normalizeText(payload.content || row.content || summary);
  const whyItMatters = normalizeText(payload.why_it_matters || row.why_it_matters || summary);
  const keyPoints = ensureArray(payload.key_points, row.key_points || []).slice(0, 5);

  if (!title || !summary || !content || !whyItMatters || keyPoints.length < 3) {
    throw new Error(`Invalid news rewrite payload for ${row.slug}`);
  }

  return {
    title,
    dek,
    summary,
    content,
    why_it_matters: whyItMatters,
    key_points: keyPoints,
    meta_title: clamp(payload.meta_title || row.meta_title || title, 70),
    meta_description: clamp(payload.meta_description || row.meta_description || summary, 160),
    og_image_alt: clamp(
      payload.og_image_alt || row.og_image_alt || `${title} news illustration`,
      140
    )
  };
}

function ensureBlogRewrite(payload, row) {
  const title = clamp(payload.title || row.title, 70);
  const excerpt = normalizeText(payload.excerpt || row.excerpt || title);
  const body = normalizeText(payload.body || row.body || excerpt);

  if (!title || !excerpt || !body) {
    throw new Error(`Invalid blog rewrite payload for ${row.slug}`);
  }

  return {
    title,
    excerpt,
    body,
    meta_title: clamp(payload.meta_title || row.meta_title || title, 70),
    meta_description: clamp(payload.meta_description || row.meta_description || excerpt, 160),
    og_image_alt: clamp(
      payload.og_image_alt || row.og_image_alt || `${title} editorial illustration`,
      140
    )
  };
}

async function backupPublishedContent(newsRows, blogRows) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `content-rewrite-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        news: newsRows,
        blog: blogRows
      },
      null,
      2
    )
  );
  return backupPath;
}

async function loadPublishedNews() {
  const { rows } = await pool.query(`
    select id, slug, title, dek, summary, content, why_it_matters, key_points,
           tags, topics, entities, meta_title, meta_description, og_image_alt,
           preview_image_caption, generated_image_alt, internal_links, source_name, source_url
    from news_items
    where status = 'published'
    order by published_at desc nulls last, created_at desc
  `);
  return rows;
}

async function loadPublishedBlog() {
  const { rows } = await pool.query(`
    select id, slug, title, excerpt, body, tags, meta_title, meta_description, og_image_alt
    from blog_posts
    where status = 'published'
    order by published_at desc nulls last, created_at desc
  `);
  return rows;
}

async function rewriteNews(newsRows) {
  let updated = 0;
  for (const row of newsRows) {
    const improved = ensureNewsRewrite(await callOpenAi(buildNewsPrompt(row)), row);
    const internalLinks = improveInternalLinks(row.internal_links);
    await pool.query(
      `
        update news_items
        set
          title = $2,
          dek = $3,
          summary = $4,
          content = $5,
          why_it_matters = $6,
          key_points = $7::jsonb,
          meta_title = $8,
          meta_description = $9,
          og_image_alt = $10,
          generated_image_alt = coalesce(generated_image_alt, $10),
          internal_links = $11::jsonb,
          reading_time_minutes = $12,
          word_count = $13,
          char_count = $14,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        row.id,
        improved.title,
        improved.dek,
        improved.summary,
        improved.content,
        improved.why_it_matters,
        JSON.stringify(improved.key_points),
        improved.meta_title,
        improved.meta_description,
        improved.og_image_alt,
        JSON.stringify(internalLinks),
        readingTimeMinutes(improved.content),
        countWords(improved.content),
        countChars(improved.content)
      ]
    );
    updated += 1;
    console.log(`[rewrite-existing-content] news updated ${updated}/${newsRows.length} slug=${row.slug}`);
  }
  return updated;
}

async function rewriteBlog(blogRows) {
  let updated = 0;
  for (const row of blogRows) {
    const improved = ensureBlogRewrite(await callOpenAi(buildBlogPrompt(row)), row);
    await pool.query(
      `
        update blog_posts
        set
          title = $2,
          excerpt = $3,
          body = $4,
          meta_title = $5,
          meta_description = $6,
          og_image_alt = $7,
          reading_time_minutes = $8,
          word_count = $9,
          char_count = $10,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        row.id,
        improved.title,
        improved.excerpt,
        improved.body,
        improved.meta_title,
        improved.meta_description,
        improved.og_image_alt,
        readingTimeMinutes(improved.body),
        countWords(improved.body),
        countChars(improved.body)
      ]
    );
    updated += 1;
    console.log(`[rewrite-existing-content] blog updated ${updated}/${blogRows.length} slug=${row.slug}`);
  }
  return updated;
}

async function main() {
  try {
    const [newsRows, blogRows] = await Promise.all([loadPublishedNews(), loadPublishedBlog()]);
    const backupPath = await backupPublishedContent(newsRows, blogRows);
    console.log(`[rewrite-existing-content] backup saved ${backupPath}`);

    const updatedNews = await rewriteNews(newsRows);
    const updatedBlog = await rewriteBlog(blogRows);

    console.log(
      `[rewrite-existing-content] complete news=${updatedNews}/${newsRows.length} blog=${updatedBlog}/${blogRows.length}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[rewrite-existing-content] failed:", error);
  process.exitCode = 1;
});
