import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
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

function countCharsNoSpaces(value) {
  return normalizeText(value).replace(/\s+/g, "").length;
}

function readingTimeMinutes(value) {
  return Math.max(1, Math.ceil(countWords(value) / 220));
}

function buildPrompt(row) {
  return [
    "You are a senior editor polishing a published blog article for an English-language Ukraine support site.",
    "The article should feel human-edited, direct, useful, and calm.",
    "Do not invent new facts or numbers.",
    "Keep the core meaning, but make the opening more engaging and less generic.",
    "Remove abstract filler, repetitive structure, and generic explainer tone.",
    "Make the first two paragraphs and the excerpt noticeably stronger so readers feel an immediate editorial improvement.",
    "Use short and medium paragraphs with a clear rhythm suitable for mobile reading.",
    "Return strict JSON only.",
    "",
    "Output keys:",
    "title, excerpt, body, meta_title, meta_description, og_image_alt",
    "",
    "Constraints:",
    "- title <= 70 chars",
    "- excerpt must be a direct, readable 1-2 sentence summary",
    "- body should keep markdown headings if helpful",
    "- opening should be concrete and useful, not generic throat-clearing",
    "- meta_title <= 70 chars",
    "- meta_description 90-160 chars",
    "- og_image_alt should be descriptive and natural",
    "",
    "Avoid phrases like:",
    "it is worth noting, in addition, moreover, this reflects a clear reality, in today's rapidly changing world",
    "",
    "Current blog fields:",
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
            "You are a careful editor polishing published blog copy. Preserve meaning. Output valid JSON only."
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
  const excerpt = normalizeText(payload.excerpt || row.excerpt || title);
  const body = normalizeText(payload.body || row.body || excerpt);

  if (!title || !excerpt || !body) {
    throw new Error(`Invalid blog refinement payload for ${row.slug}`);
  }

  return {
    title,
    excerpt,
    body,
    meta_title: clamp(payload.meta_title || row.meta_title || title, 70),
    meta_description: clamp(payload.meta_description || row.meta_description || excerpt, 160),
    og_image_alt: clamp(payload.og_image_alt || row.og_image_alt || `${title} editorial illustration`, 140)
  };
}

async function backup(rows) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `blog-refine-backup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), rows }, null, 2));
  return backupPath;
}

async function main() {
  try {
    const queryText =
      targetSlugs.length > 0
        ? `
      select id, slug, title, excerpt, body, tags, meta_title, meta_description, og_image_alt
      from blog_posts
      where status = 'published'
        and slug = any($1::text[])
      order by published_at desc nulls last, created_at desc
    `
        : `
      select id, slug, title, excerpt, body, tags, meta_title, meta_description, og_image_alt
      from blog_posts
      where status = 'published'
      order by published_at desc nulls last, created_at desc
    `;

    const { rows } =
      targetSlugs.length > 0 ? await pool.query(queryText, [targetSlugs]) : await pool.query(queryText);
    const backupPath = await backup(rows);
    console.log(`[refine-blog-posts] backup saved ${backupPath}`);

    let updated = 0;
    for (const row of rows) {
      const improved = ensurePayload(await callOpenAi(buildPrompt(row)), row);
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
      console.log(`[refine-blog-posts] updated ${updated}/${rows.length} slug=${row.slug}`);
    }

    console.log(`[refine-blog-posts] complete updated=${updated}/${rows.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[refine-blog-posts] failed:", error);
  process.exitCode = 1;
});
