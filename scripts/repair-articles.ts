import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import {
  sanitizeArticleForPublishing
} from "@/lib/article-normalization";

const { Pool } = pg;

type Flags = {
  dryRun: boolean;
  slug?: string;
  id?: string;
  type: "news" | "blog" | "all";
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    dryRun: argv.includes("--dry-run"),
    type: "all"
  };

  for (const arg of argv) {
    if (arg.startsWith("--slug=")) {
      flags.slug = arg.slice("--slug=".length);
    }
    if (arg.startsWith("--id=")) {
      flags.id = arg.slice("--id=".length);
    }
    if (arg.startsWith("--type=")) {
      const value = arg.slice("--type=".length);
      if (value === "news" || value === "blog" || value === "all") {
        flags.type = value;
      }
    }
  }

  return flags;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
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

function buildNewsFilter(flags: Flags) {
  const conditions = ["status = 'published'"];
  const values: string[] = [];

  if (flags.slug) {
    values.push(flags.slug);
    conditions.push(`slug = $${values.length}`);
  }

  if (flags.id) {
    values.push(flags.id);
    conditions.push(`id::text = $${values.length}`);
  }

  return {
    text: `
      select id, slug, title, dek, summary, content, why_it_matters, source_name, source_url,
             preview_image_url, preview_image_caption, og_image_alt, generated_image_url,
             generated_image_caption, generated_image_alt, meta_description
      from news_items
      where ${conditions.join(" and ")}
      order by published_at desc nulls last, created_at desc
    `,
    values
  };
}

function buildBlogFilter(flags: Flags) {
  const conditions = ["status = 'published'"];
  const values: string[] = [];

  if (flags.slug) {
    values.push(flags.slug);
    conditions.push(`slug = $${values.length}`);
  }

  if (flags.id) {
    values.push(flags.id);
    conditions.push(`id::text = $${values.length}`);
  }

  return {
    text: `
      select id, slug, title, excerpt, body, og_image_alt, cover_image_url
      from blog_posts
      where ${conditions.join(" and ")}
      order by published_at desc nulls last, created_at desc
    `,
    values
  };
}

async function main() {
  loadRuntimeEnv();
  const flags = parseFlags(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 4
  });

  try {
    let updatedNews = 0;
    let updatedBlog = 0;

    if (flags.type === "all" || flags.type === "news") {
      const filter = buildNewsFilter(flags);
      const { rows } = await pool.query(filter.text, filter.values);

      for (const row of rows) {
        const sanitized = sanitizeArticleForPublishing({
          type: "news",
          title: row.title,
          summary: row.summary || row.dek,
          content: row.content,
          whyItMatters: row.why_it_matters,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          previewImageUrl: row.preview_image_url,
          previewImageCaption: row.preview_image_caption,
          previewImageAlt: row.og_image_alt,
          generatedImageUrl: row.generated_image_url,
          generatedImageCaption: row.generated_image_caption,
          generatedImageAlt: row.generated_image_alt
        });

        const nextValues = {
          title: sanitized.title,
          dek: sanitized.lead,
          summary: sanitized.excerpt,
          content: sanitized.body,
          preview_image_caption: sanitized.previewImageCaption ?? null,
          generated_image_url: sanitized.generatedImageUrl ?? null,
          generated_image_caption: sanitized.generatedImageCaption ?? null,
          generated_image_alt: sanitized.generatedImageAlt ?? null,
          og_image_alt: sanitized.primaryImageAlt,
          meta_description: sanitized.metaDescription,
          char_count: sanitized.body.replace(/\s+/g, "").length,
          word_count: countWords(sanitized.body),
          reading_time_minutes: readingTimeMinutes(sanitized.body)
        };

        console.log(
          `[repair-articles] news slug=${row.slug} dryRun=${flags.dryRun} generated=${Boolean(nextValues.generated_image_url)}`
        );

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
            [
              row.id,
              nextValues.title,
              nextValues.dek,
              nextValues.summary,
              nextValues.content,
              nextValues.preview_image_caption,
              nextValues.generated_image_url,
              nextValues.generated_image_caption,
              nextValues.generated_image_alt,
              nextValues.og_image_alt,
              nextValues.meta_description,
              nextValues.char_count,
              nextValues.word_count,
              nextValues.reading_time_minutes
            ]
          );
        }

        updatedNews += 1;
      }
    }

    if (flags.type === "all" || flags.type === "blog") {
      const filter = buildBlogFilter(flags);
      const { rows } = await pool.query(filter.text, filter.values);

      for (const row of rows) {
        const sanitized = sanitizeArticleForPublishing({
          type: "blog",
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          previewImageUrl: row.cover_image_url,
          previewImageAlt: row.og_image_alt
        });

        console.log(`[repair-articles] blog slug=${row.slug} dryRun=${flags.dryRun}`);

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
            [
              row.id,
              sanitized.title,
              sanitized.excerpt,
              sanitized.body,
              sanitized.primaryImageAlt,
              sanitized.metaDescription,
              sanitized.body.replace(/\s+/g, "").length,
              countWords(sanitized.body),
              readingTimeMinutes(sanitized.body)
            ]
          );
        }

        updatedBlog += 1;
      }
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: flags.dryRun,
          type: flags.type,
          updatedNews,
          updatedBlog,
          targetSlug: flags.slug ?? null,
          targetId: flags.id ?? null
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[repair-articles] failed:", error);
  process.exitCode = 1;
});
