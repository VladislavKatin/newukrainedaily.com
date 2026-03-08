import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const MIN_NEWS_CHARS_NO_SPACES = 1500;
const MIN_BLOG_CHARS_NO_SPACES = 1800;

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

function countCharsNoSpaces(value) {
  return normalizeText(value).replace(/\s+/g, "").length;
}

function countWords(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(/\s+/).length : 0;
}

function readingTimeMinutes(value) {
  return Math.max(1, Math.ceil(countWords(value) / 220));
}

function clamp(value, max) {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function ensureArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  return fallback;
}

function backupPath(filePrefix) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(backupDir, `${filePrefix}-${stamp}.json`);
}

async function backup(newsRows, blogRows) {
  const filePath = backupPath("short-content-backup");
  fs.writeFileSync(
    filePath,
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
  return filePath;
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
            "You are a senior editor expanding and polishing published site content. Preserve facts. Output valid JSON only."
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

function buildNewsPrompt(row) {
  return [
    "You are a senior editor rewriting a published English-language Ukraine news article.",
    "The current article is too short or too thin. Rewrite it so it sounds human-edited, natural, and publication-ready.",
    "Preserve only supported facts already present in the article and source fields.",
    "Do not invent quotes, dates, casualty counts, numbers, or claims.",
    "Use clearer structure and sharper editorial English.",
    "Required output JSON keys:",
    "title, dek, summary, content, why_it_matters, key_points, meta_title, meta_description, og_image_alt",
    "",
    "Hard requirements:",
    `- content must be at least ${MIN_NEWS_CHARS_NO_SPACES} characters without spaces`,
    "- use short and medium paragraphs",
    "- make the first two paragraphs clearly stronger than the current version",
    "- keep a neutral news tone",
    "- summary should be concise and useful",
    "- why_it_matters should be specific",
    "",
    "Current article:",
    JSON.stringify(row, null, 2)
  ].join("\n");
}

function buildBlogPrompt(row) {
  return [
    "You are a senior editor rewriting a published English-language blog article about Ukraine.",
    "The article is too short. Expand and improve it while preserving the existing factual meaning and purpose.",
    "Do not add unsupported facts or statistics.",
    "Make it read like a human-edited long-form explainer with clean sections and short paragraphs.",
    "Required output JSON keys:",
    "title, excerpt, body, meta_title, meta_description, og_image_alt",
    "",
    "Hard requirements:",
    `- body must be at least ${MIN_BLOG_CHARS_NO_SPACES} characters without spaces`,
    "- body should stay practical, readable, and editorial",
    "- opening paragraphs should be noticeably stronger",
    "",
    "Current article:",
    JSON.stringify(row, null, 2)
  ].join("\n");
}

function buildNewsExpansionPrompt(row, previousContent, currentCount) {
  return [
    "You are fixing a published English-language Ukraine news article that is still too short after a rewrite.",
    "Expand it without inventing facts.",
    "You may add careful editorial context only if it is generic, non-numeric, and clearly framed around the already stated facts.",
    "Keep the same factual meaning and neutral tone.",
    "Return strict JSON with the same keys:",
    "title, dek, summary, content, why_it_matters, key_points, meta_title, meta_description, og_image_alt",
    "",
    `The current body is only ${currentCount} characters without spaces.`,
    `The rewritten body must be at least ${MIN_NEWS_CHARS_NO_SPACES} characters without spaces.`,
    "Use 7-10 short or medium paragraphs.",
    "Strengthen 'what happened', 'why it matters', and the immediate context sections.",
    "",
    "Current article:",
    JSON.stringify(row, null, 2),
    "",
    "Previous too-short rewrite body:",
    previousContent
  ].join("\n");
}

function normalizeNewsPayload(payload, row) {
  const content = normalizeText(payload.content || row.content);
  const dek = normalizeText(payload.dek || row.dek || row.summary || row.title);
  const summary = normalizeText(payload.summary || row.summary || dek);
  const whyItMatters = normalizeText(payload.why_it_matters || row.why_it_matters || summary);
  const keyPoints = ensureArray(payload.key_points, row.key_points || []).slice(0, 5);

  if (countCharsNoSpaces(content) < MIN_NEWS_CHARS_NO_SPACES) {
    throw new Error(`News rewrite still too short for ${row.slug}`);
  }

  return {
    title: clamp(payload.title || row.title, 70),
    dek,
    summary,
    content,
    why_it_matters: whyItMatters,
    key_points: keyPoints.length >= 3 ? keyPoints : ensureArray(row.key_points, []).slice(0, 5),
    meta_title: clamp(payload.meta_title || row.meta_title || row.title, 70),
    meta_description: clamp(payload.meta_description || row.meta_description || summary, 160),
    og_image_alt: clamp(payload.og_image_alt || row.og_image_alt || `${row.title} news image`, 140)
  };
}

function normalizeBlogPayload(payload, row) {
  const body = normalizeText(payload.body || row.body);
  const excerpt = normalizeText(payload.excerpt || row.excerpt || row.title);

  if (countCharsNoSpaces(body) < MIN_BLOG_CHARS_NO_SPACES) {
    throw new Error(`Blog rewrite still too short for ${row.slug}`);
  }

  return {
    title: clamp(payload.title || row.title, 70),
    excerpt,
    body,
    meta_title: clamp(payload.meta_title || row.meta_title || row.title, 70),
    meta_description: clamp(payload.meta_description || row.meta_description || excerpt, 160),
    og_image_alt: clamp(payload.og_image_alt || row.og_image_alt || `${row.title} editorial image`, 140)
  };
}

async function loadShortNews() {
  const { rows } = await pool.query(`
    select id, slug, title, dek, summary, content, why_it_matters, key_points,
           tags, topics, entities, meta_title, meta_description, og_image_alt,
           source_name, source_url, char_count
    from news_items
    where status = 'published'
      and length(regexp_replace(coalesce(content, ''), '\s+', '', 'g')) < $1
    order by published_at desc nulls last, created_at desc
  `, [MIN_NEWS_CHARS_NO_SPACES]);
  return rows;
}

async function loadShortBlog() {
  const { rows } = await pool.query(`
    select id, slug, title, excerpt, body, tags, meta_title, meta_description, og_image_alt, char_count
    from blog_posts
    where status = 'published'
      and length(regexp_replace(coalesce(body, ''), '\s+', '', 'g')) < $1
    order by published_at desc nulls last, created_at desc
  `, [MIN_BLOG_CHARS_NO_SPACES]);
  return rows;
}

async function rewriteShortNews(rows) {
  let updated = 0;

  for (const row of rows) {
    let improved = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const payload =
        attempt === 0
          ? await callOpenAi(buildNewsPrompt(row))
          : await callOpenAi(
              buildNewsExpansionPrompt(row, improved?.content || row.content || "", countCharsNoSpaces(improved?.content || row.content || ""))
            );

      try {
        improved = normalizeNewsPayload(payload, row);
        break;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }

    if (!improved) {
      throw new Error(`Unable to rewrite ${row.slug}`);
    }

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
          reading_time_minutes = $11,
          word_count = $12,
          char_count = $13,
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
        readingTimeMinutes(improved.content),
        countWords(improved.content),
        countCharsNoSpaces(improved.content)
      ]
    );

    updated += 1;
    console.log(`[fix-short-published-content] news ${updated}/${rows.length} slug=${row.slug}`);
  }

  return updated;
}

async function rewriteShortBlog(rows) {
  let updated = 0;

  for (const row of rows) {
    const payload = await callOpenAi(buildBlogPrompt(row));
    const improved = normalizeBlogPayload(payload, row);

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
        countCharsNoSpaces(improved.body)
      ]
    );

    updated += 1;
    console.log(`[fix-short-published-content] blog ${updated}/${rows.length} slug=${row.slug}`);
  }

  return updated;
}

async function main() {
  try {
    const [shortNews, shortBlog] = await Promise.all([loadShortNews(), loadShortBlog()]);
    const backupFile = await backup(shortNews, shortBlog);
    console.log(`[fix-short-published-content] backup=${backupFile} shortNews=${shortNews.length} shortBlog=${shortBlog.length}`);

    const updatedNews = await rewriteShortNews(shortNews);
    const updatedBlog = await rewriteShortBlog(shortBlog);

    console.log(
      `[fix-short-published-content] complete updatedNews=${updatedNews}/${shortNews.length} updatedBlog=${updatedBlog}/${shortBlog.length}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[fix-short-published-content] failed:", error);
  process.exitCode = 1;
});
