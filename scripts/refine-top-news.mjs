import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const TOP_LIMIT = 10;
const targetSlugs = String(process.env.TARGET_SLUGS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

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
  max: 3
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

  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}...`;
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

      return {
        type: link?.type === "topic" ? "topic" : "article",
        href,
        title,
        anchor: link?.type === "topic" ? `More on ${title}` : title
      };
    })
    .filter(Boolean)
    .slice(0, 7);
}

function buildPrompt(row) {
  return [
    "You are a senior digital news editor polishing one of the most visible stories on an English-language Ukraine news site.",
    "The article is already published. Improve it so it reads like a carefully edited newsroom piece for international readers.",
    "Preserve the factual meaning. Do not invent or add unsupported facts.",
    "Focus on stronger openings, cleaner transitions, shorter paragraphs, and a more natural editorial rhythm.",
    "Make the change visible in the first screenful of the article: rewrite the dek, summary, and first two body paragraphs so they feel noticeably sharper and more human.",
    "Remove robotic wording, generic framing, obvious AI phrasing, and repetitive structure.",
    "If there is a weak date, claim, or phrasing, make it safer and cleaner without changing the meaning.",
    "Treat the provided published_at value as factual context. Do not change the year, month, or day unless the current article fields already contain a confirmed correction.",
    "Keep the tone calm, factual, and publication-ready.",
    "Return strict JSON only.",
    "",
    "Output keys:",
    "title, dek, summary, content, why_it_matters, key_points, meta_title, meta_description, og_image_alt",
    "",
    "Constraints:",
    "- title <= 70 chars",
    "- dek should be strong, direct, and readable",
    "- summary should feel like a strong article preview, not a duplicate of the title",
    "- first paragraph should open with the central fact, not background throat-clearing",
    "- second paragraph should add the most important context or consequence",
    "- content should use short and medium paragraphs with one main idea per paragraph",
    "- why_it_matters should be specific and useful",
    "- key_points 3-5 concise bullets",
    "- meta_title <= 70 chars",
    "- meta_description 90-160 chars and written for click-through without sounding promotional",
    "- og_image_alt should be descriptive and natural",
    "",
    "Avoid phrases like:",
    "in addition, moreover, it is worth noting, this development highlights, according to him, according to her, as a result of this",
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
        published_at: row.published_at,
        source_name: row.source_name,
        source_url: row.source_url
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
            "You are a careful editor polishing published news copy. Preserve facts. Preserve dates. Output valid JSON only."
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

function ensurePayload(payload, row) {
  const title = clamp(payload.title || row.title, 70);
  const dek = normalizeText(payload.dek || row.dek || row.summary || title);
  const summary = normalizeText(payload.summary || row.summary || dek);
  const content = normalizeText(payload.content || row.content || summary);
  const whyItMatters = normalizeText(payload.why_it_matters || row.why_it_matters || summary);
  const keyPoints = ensureArray(payload.key_points, row.key_points || []).slice(0, 5);

  if (!title || !dek || !summary || !content || !whyItMatters || keyPoints.length < 3) {
    throw new Error(`Invalid top-news refinement payload for ${row.slug}`);
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
    og_image_alt: clamp(payload.og_image_alt || row.og_image_alt || `${title} news image`, 140)
  };
}

async function backup(rows) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `top-news-refine-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), rows }, null, 2));
  return backupPath;
}

async function main() {
  try {
    const queryText =
      targetSlugs.length > 0
        ? `
      select id, slug, title, dek, summary, content, why_it_matters, key_points,
             tags, topics, entities, meta_title, meta_description, og_image_alt,
             internal_links, source_name, source_url, published_at
      from news_items
      where status = 'published'
        and slug = any($1::text[])
      order by published_at desc nulls last, created_at desc
    `
        : `
      select id, slug, title, dek, summary, content, why_it_matters, key_points,
             tags, topics, entities, meta_title, meta_description, og_image_alt,
             internal_links, source_name, source_url, published_at
      from news_items
      where status = 'published'
      order by published_at desc nulls last, created_at desc
      limit $1
    `;

    const { rows } = await pool.query(queryText, [targetSlugs.length > 0 ? targetSlugs : TOP_LIMIT]);
    const backupPath = await backup(rows);
    console.log(`[refine-top-news] backup saved ${backupPath}`);

    let updated = 0;
    for (const row of rows) {
      const improved = ensurePayload(await callOpenAi(buildPrompt(row)), row);
      const links = improveInternalLinks(row.internal_links);

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
          JSON.stringify(links),
          readingTimeMinutes(improved.content),
          countWords(improved.content),
          countChars(improved.content)
        ]
      );

      updated += 1;
      console.log(`[refine-top-news] updated ${updated}/${rows.length} slug=${row.slug}`);
    }

    console.log(`[refine-top-news] complete updated=${updated}/${rows.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[refine-top-news] failed:", error);
  process.exitCode = 1;
});
