import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { sanitizeArticleForPublishing, normalizeTitle } from "@/lib/article-normalization";

const { Pool } = pg;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

type Flags = {
  dryRun: boolean;
  slug?: string;
  id?: string;
  type: "news" | "blog" | "all";
  limit: number;
  offset: number;
  noAi: boolean;
  needsRepairOnly: boolean;
};

type RewritePayload = {
  title: string;
  dek: string;
  summary: string;
  body: string;
  why_it_matters?: string;
  meta_description: string;
  image_alt: string;
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    dryRun: argv.includes("--dry-run"),
    type: "all",
    limit: 100,
    offset: 0,
    noAi: argv.includes("--no-ai"),
    needsRepairOnly: argv.includes("--needs-repair-only")
  };

  for (const arg of argv) {
    if (arg.startsWith("--slug=")) flags.slug = arg.slice("--slug=".length);
    if (arg.startsWith("--id=")) flags.id = arg.slice("--id=".length);
    if (arg.startsWith("--type=")) {
      const value = arg.slice("--type=".length);
      if (value === "news" || value === "blog" || value === "all") flags.type = value;
    }
    if (arg.startsWith("--limit=")) flags.limit = Math.max(1, Number(arg.slice("--limit=".length)) || 100);
    if (arg.startsWith("--offset=")) flags.offset = Math.max(0, Number(arg.slice("--offset=".length)) || 0);
  }

  return flags;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    process.env[trimmed.slice(0, idx).trim()] = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
  }
}

function loadRuntimeEnv(cwd = process.cwd()) {
  for (const fileName of [".env.local", ".env", ".env.vercel.prod"]) {
    loadEnvFile(path.join(cwd, fileName));
  }
}

function countWords(value: string) {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function readingTimeMinutes(value: string) {
  return Math.max(1, Math.ceil(countWords(value) / 220));
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeMultiline(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clampText(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 3).trim()}...`;
}

function buildWhere(flags: Flags, contentColumn: string) {
  const conditions = ["status = 'published'"];
  const values: Array<string | number> = [];

  if (flags.slug) {
    values.push(flags.slug);
    conditions.push(`slug = $${values.length}`);
  }

  if (flags.id) {
    values.push(flags.id);
    conditions.push(`id::text = $${values.length}`);
  }

  if (flags.needsRepairOnly) {
    conditions.push(`(${contentColumn} not like '## %' or meta_description is null or char_count is null or og_image_alt is null)`);
  }

  return { conditions, values };
}

function buildNewsFilter(flags: Flags) {
  const { conditions, values } = buildWhere(flags, "content");
  values.push(flags.limit, flags.offset);
  return {
    text: `
      select id, slug, title, dek, summary, content, why_it_matters, source_name, source_url,
             preview_image_url, preview_image_caption, og_image_alt, generated_image_url,
             generated_image_caption, generated_image_alt, meta_description
      from news_items
      where ${conditions.join(" and ")}
      order by published_at desc nulls last, created_at desc
      limit $${values.length - 1}
      offset $${values.length}
    `,
    values
  };
}

function buildBlogFilter(flags: Flags) {
  const { conditions, values } = buildWhere(flags, "body");
  values.push(flags.limit, flags.offset);
  return {
    text: `
      select id, slug, title, excerpt, body, og_image_alt, cover_image_url, meta_description
      from blog_posts
      where ${conditions.join(" and ")}
      order by published_at desc nulls last, created_at desc
      limit $${values.length - 1}
      offset $${values.length}
    `,
    values
  };
}

function getApiKey(flags: Flags) {
  if (flags.noAi) return "";
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
}

function getModel() {
  const provider = process.env.AI_PROVIDER || "openai:gpt-4o-mini";
  const [, configuredModel] = provider.split(":", 2);
  return configuredModel || DEFAULT_OPENAI_MODEL;
}

function buildRepairPrompt(input: {
  type: "news" | "blog";
  title: string;
  dek?: string | null;
  summary?: string | null;
  body: string;
  whyItMatters?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  imageAlt?: string | null;
  metaDescription?: string | null;
}) {
  const sectionLabel = input.type === "news" ? "news report" : "editorial explainer";
  return [
    `You are a senior newsroom editor rewriting an existing ${sectionLabel} for an English-language Ukraine site.`,
    "Preserve the factual meaning. Do not invent facts.",
    "Rewrite weak, generic, repetitive, AI-sounding copy into clean human editorial English.",
    "The opening must be factual and direct.",
    "Use short readable paragraphs.",
    "Add clear H2 sections in the body.",
    "Do not use filler like 'this highlights', 'this underscores', 'moreover', 'in addition', 'it remains to be seen'.",
    "Keep source attribution factual and restrained.",
    "Return strict JSON only.",
    "",
    "Return keys:",
    "title, dek, summary, body, why_it_matters, meta_description, image_alt",
    "",
    "Hard requirements:",
    "- title <= 90 chars, factual and natural",
    "- dek 1-2 sentences, strong lead",
    "- summary 1-2 sentences, no fluff",
    "- body must preserve facts and use markdown H2 headings",
    "- body should read like a real edited article, not an SEO rewrite",
    "- meta_description 120-160 chars",
    "- image_alt concise and factual",
    "",
    `Source name: ${input.sourceName || "Editorial Desk"}`,
    `Source URL: ${input.sourceUrl || "n/a"}`,
    `Current title: ${input.title}`,
    `Current dek: ${input.dek || ""}`,
    `Current summary: ${input.summary || ""}`,
    `Current why it matters: ${input.whyItMatters || ""}`,
    `Current meta description: ${input.metaDescription || ""}`,
    `Current image alt: ${input.imageAlt || ""}`,
    "Current article body:",
    input.body
  ].join("\n");
}

async function rewriteWithOpenAi(prompt: string, flags: Flags): Promise<RewritePayload | null> {
  const apiKey = getApiKey(flags);
  if (!apiKey) return null;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a strict editor. Output valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI repair rewrite failed: ${response.status} ${message}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | null } }> };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const body = normalizeMultiline(parsed.body);
  if (!body) return null;

  return {
    title: clampText(normalizeText(parsed.title), 90),
    dek: clampText(normalizeText(parsed.dek || parsed.summary), 320),
    summary: clampText(normalizeText(parsed.summary || parsed.dek), 320),
    body,
    why_it_matters: clampText(normalizeText(parsed.why_it_matters), 1000),
    meta_description: clampText(normalizeText(parsed.meta_description), 160),
    image_alt: clampText(normalizeText(parsed.image_alt), 140)
  };
}

async function rewriteNewsRow(row: Record<string, unknown>, flags: Flags) {
  const currentBody = normalizeMultiline([row.summary, row.content, row.why_it_matters].filter(Boolean).join("\n\n"));
  const aiRewrite = await rewriteWithOpenAi(
    buildRepairPrompt({
      type: "news",
      title: String(row.title || ""),
      dek: (row.dek as string | null) || null,
      summary: (row.summary as string | null) || null,
      body: currentBody,
      whyItMatters: (row.why_it_matters as string | null) || null,
      sourceName: (row.source_name as string | null) || null,
      sourceUrl: (row.source_url as string | null) || null,
      imageAlt: (row.og_image_alt as string | null) || null,
      metaDescription: (row.meta_description as string | null) || null
    }),
    flags
  );

  const sanitized = sanitizeArticleForPublishing({
    type: "news",
    title: aiRewrite?.title || String(row.title || ""),
    summary: aiRewrite?.summary || (row.summary as string | null) || (row.dek as string | null),
    content: aiRewrite?.body || currentBody,
    whyItMatters: aiRewrite?.why_it_matters || (row.why_it_matters as string | null),
    sourceName: (row.source_name as string | null) || null,
    sourceUrl: (row.source_url as string | null) || null,
    previewImageUrl: (row.preview_image_url as string | null) || null,
    previewImageCaption: (row.preview_image_caption as string | null) || null,
    previewImageAlt: aiRewrite?.image_alt || (row.og_image_alt as string | null) || null,
    generatedImageUrl: (row.generated_image_url as string | null) || null,
    generatedImageCaption: (row.generated_image_caption as string | null) || null,
    generatedImageAlt: (row.generated_image_alt as string | null) || null
  });

  return {
    aiUsed: Boolean(aiRewrite),
    title: normalizeTitle(aiRewrite?.title || String(row.title || "")),
    dek: aiRewrite?.dek || sanitized.lead,
    summary: aiRewrite?.summary || sanitized.excerpt,
    content: sanitized.body,
    preview_image_caption: sanitized.previewImageCaption ?? null,
    generated_image_url: sanitized.generatedImageUrl ?? null,
    generated_image_caption: sanitized.generatedImageCaption ?? null,
    generated_image_alt: sanitized.generatedImageAlt ?? null,
    og_image_alt: aiRewrite?.image_alt || sanitized.primaryImageAlt,
    meta_description: aiRewrite?.meta_description || sanitized.metaDescription,
    char_count: sanitized.body.replace(/\s+/g, "").length,
    word_count: countWords(sanitized.body),
    reading_time_minutes: readingTimeMinutes(sanitized.body)
  };
}

async function rewriteBlogRow(row: Record<string, unknown>, flags: Flags) {
  const currentBody = normalizeMultiline([(row.excerpt as string | null) || null, row.body].filter(Boolean).join("\n\n"));
  const aiRewrite = await rewriteWithOpenAi(
    buildRepairPrompt({
      type: "blog",
      title: String(row.title || ""),
      summary: (row.excerpt as string | null) || null,
      body: currentBody,
      imageAlt: (row.og_image_alt as string | null) || null,
      metaDescription: (row.meta_description as string | null) || null
    }),
    flags
  );

  const sanitized = sanitizeArticleForPublishing({
    type: "blog",
    title: aiRewrite?.title || String(row.title || ""),
    excerpt: aiRewrite?.summary || (row.excerpt as string | null),
    body: aiRewrite?.body || currentBody,
    previewImageUrl: (row.cover_image_url as string | null) || null,
    previewImageAlt: aiRewrite?.image_alt || (row.og_image_alt as string | null) || null
  });

  return {
    aiUsed: Boolean(aiRewrite),
    title: normalizeTitle(aiRewrite?.title || String(row.title || "")),
    excerpt: aiRewrite?.summary || sanitized.excerpt,
    body: sanitized.body,
    og_image_alt: aiRewrite?.image_alt || sanitized.primaryImageAlt,
    meta_description: aiRewrite?.meta_description || sanitized.metaDescription,
    char_count: sanitized.body.replace(/\s+/g, "").length,
    word_count: countWords(sanitized.body),
    reading_time_minutes: readingTimeMinutes(sanitized.body)
  };
}

async function main() {
  loadRuntimeEnv();
  const flags = parseFlags(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");

  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 4 });

  try {
    let updatedNews = 0;
    let updatedBlog = 0;
    let aiRewrittenNews = 0;
    let aiRewrittenBlog = 0;

    if (flags.type === "all" || flags.type === "news") {
      const filter = buildNewsFilter(flags);
      const { rows } = await pool.query(filter.text, filter.values);
      for (const row of rows) {
        const nextValues = await rewriteNewsRow(row, flags);
        console.log(`[repair-articles] news slug=${row.slug} dryRun=${flags.dryRun} aiUsed=${nextValues.aiUsed} charCount=${nextValues.char_count}`);
        if (!flags.dryRun) {
          await pool.query(
            `
              update news_items
              set
                title = $2,
                dek = $3,
                summary = $4,
                content = $5,
                preview_image_caption = $6,
                generated_image_url = $7,
                generated_image_caption = $8,
                generated_image_alt = $9,
                og_image_alt = $10,
                meta_description = $11,
                char_count = $12,
                word_count = $13,
                reading_time_minutes = $14,
                updated_at = timezone('utc', now())
              where id = $1
            `,
            [row.id, nextValues.title, nextValues.dek, nextValues.summary, nextValues.content, nextValues.preview_image_caption, nextValues.generated_image_url, nextValues.generated_image_caption, nextValues.generated_image_alt, nextValues.og_image_alt, nextValues.meta_description, nextValues.char_count, nextValues.word_count, nextValues.reading_time_minutes]
          );
        }
        updatedNews += 1;
        if (nextValues.aiUsed) aiRewrittenNews += 1;
      }
    }

    if (flags.type === "all" || flags.type === "blog") {
      const filter = buildBlogFilter(flags);
      const { rows } = await pool.query(filter.text, filter.values);
      for (const row of rows) {
        const nextValues = await rewriteBlogRow(row, flags);
        console.log(`[repair-articles] blog slug=${row.slug} dryRun=${flags.dryRun} aiUsed=${nextValues.aiUsed} charCount=${nextValues.char_count}`);
        if (!flags.dryRun) {
          await pool.query(
            `
              update blog_posts
              set
                title = $2,
                excerpt = $3,
                body = $4,
                og_image_alt = $5,
                meta_description = $6,
                char_count = $7,
                word_count = $8,
                reading_time_minutes = $9,
                updated_at = timezone('utc', now())
              where id = $1
            `,
            [row.id, nextValues.title, nextValues.excerpt, nextValues.body, nextValues.og_image_alt, nextValues.meta_description, nextValues.char_count, nextValues.word_count, nextValues.reading_time_minutes]
          );
        }
        updatedBlog += 1;
        if (nextValues.aiUsed) aiRewrittenBlog += 1;
      }
    }

    console.log(JSON.stringify({ ok: true, dryRun: flags.dryRun, type: flags.type, limit: flags.limit, offset: flags.offset, noAi: flags.noAi, needsRepairOnly: flags.needsRepairOnly, updatedNews, updatedBlog, aiRewrittenNews, aiRewrittenBlog, targetSlug: flags.slug ?? null, targetId: flags.id ?? null }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[repair-articles] failed:", error);
  process.exitCode = 1;
});
