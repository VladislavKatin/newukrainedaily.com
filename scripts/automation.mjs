// Runs the content automation directly against the database (no web server needed).
// Used by GitHub Actions before each static rebuild of the site.
//
//   node --conditions=react-server --import tsx scripts/automation.mjs <task> [--count=1] [--date=YYYY-MM-DD]
//
// Tasks: generate, images, publish, world-digest, seo-refresh, ensure-schema,
//        fingerprint, repair-images [--limit=300], fix-years --slug=<slug> --year=<YYYY> [--to=<YYYY>]
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd());

function readFlag(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(3).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

async function ensureSchema() {
  const { query } = await import("../src/lib/db");
  const files = ["supabase/audience_poll_responses.sql"];

  for (const file of files) {
    const sql = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    await query(sql);
  }

  return { applied: files };
}

async function worldDigest() {
  const { generateWorldDigestForDate } = await import("../src/lib/world/digest");
  const { worldDigestDateFromDate } = await import("../src/lib/world/date");
  const { listWorldDigestItemsByDate } = await import("../src/lib/world-repository");
  const digestDate = readFlag("date", worldDigestDateFromDate());
  const force = process.argv.includes("--force");

  if (!force) {
    const existing = await listWorldDigestItemsByDate(digestDate);
    if (existing.length > 0) {
      return { digestDate, skipped: true, existingItems: existing.length };
    }
  }

  return { digestDate, ...(await generateWorldDigestForDate(digestDate)) };
}

// Short hash of everything the static site is built from. GitHub Actions skips the
// rebuild and Cloudflare deploy when it has not changed since the last deploy
// (Cloudflare Pages free plan allows 500 deploys a month; hourly would be 720).
async function fingerprint() {
  const { query } = await import("../src/lib/db");
  const { createHash } = await import("node:crypto");
  const probes = [
    ["news", "select count(*)::text as c, coalesce(max(updated_at)::text, '') as u from news_items where status = 'published'"],
    ["blog", "select count(*)::text as c, coalesce(max(updated_at)::text, '') as u from blog_posts where status = 'published'"],
    ["topics", "select count(*)::text as c, '' as u from topics"],
    ["world", "select count(*)::text as c, coalesce(max(updated_at)::text, '') as u from world_digest_items"]
  ];
  const parts = [];

  for (const [name, sql] of probes) {
    try {
      const { rows } = await query(sql);
      parts.push(`${name}:${rows[0]?.c}:${rows[0]?.u}`);
    } catch (error) {
      // Unknown state: force a deploy rather than risk skipping a real change.
      parts.push(`${name}:error:${Date.now()}`);
      console.warn(`[fingerprint] ${name}: ${error instanceof Error ? error.message : error}`);
    }
  }

  const value = createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `fingerprint=${value}\n`);
  }

  return { value, parts };
}

// Old article images were stored in Supabase Storage, which is no longer served
// (free plan egress quota). Copies each one to R2; if it can't be downloaded any
// more, the article falls back to its other image. Old URLs are kept in
// image_url_backup so nothing is lost.
async function repairImages() {
  const { query } = await import("../src/lib/db");
  const { saveRemoteImage } = await import("../src/lib/storage");
  const limit = Number(readFlag("limit", "300")) || 300;
  const marker = "%.supabase.co/storage/%";
  const fields = ["generated_image_url", "preview_image_url", "cover_image_url", "og_image_url"];
  const isSupabase = (url) => typeof url === "string" && url.includes(".supabase.co/storage/");

  await query(`
    create table if not exists image_url_backup (
      id bigserial primary key,
      news_item_id uuid not null,
      field text not null,
      old_url text not null,
      new_url text,
      created_at timestamptz not null default timezone('utc', now())
    )
  `);

  const where = fields.map((field) => `${field} like $1`).join(" or ");
  const total = Number((await query(`select count(*)::int as n from news_items where ${where}`, [marker])).rows[0]?.n ?? 0);
  const { rows } = await query(
    `select id, ${fields.join(", ")} from news_items where ${where} order by published_at desc nulls last limit $2`,
    [marker, limit]
  );
  const copied = new Map();
  let migrated = 0;
  let dropped = 0;

  for (const row of rows) {
    const next = {};

    for (const field of fields) {
      const url = row[field];
      if (!isSupabase(url)) continue;

      if (!copied.has(url)) {
        try {
          const stored = await saveRemoteImage(url, `migrated-${row.id}-${field.replace(/_image_url$/, "")}`);
          copied.set(url, stored.publicUrl);
          migrated += 1;
        } catch (error) {
          copied.set(url, null);
          dropped += 1;
          console.warn(`[repair-images] ${row.id} ${field}: ${error instanceof Error ? error.message : error}`);
        }
      }

      next[field] = copied.get(url);
    }

    const generated = "generated_image_url" in next ? next.generated_image_url : row.generated_image_url;
    const preview = "preview_image_url" in next ? next.preview_image_url : row.preview_image_url;
    const fallback = generated || preview || null;
    const final = {
      generated_image_url: generated,
      preview_image_url: preview,
      cover_image_url: "cover_image_url" in next ? next.cover_image_url || fallback : row.cover_image_url,
      og_image_url: "og_image_url" in next ? next.og_image_url || fallback : row.og_image_url
    };

    for (const field of Object.keys(next)) {
      await query(
        `insert into image_url_backup (news_item_id, field, old_url, new_url) values ($1, $2, $3, $4)`,
        [row.id, field, row[field], final[field]]
      );
    }

    await query(
      `update news_items set generated_image_url = $2, preview_image_url = $3, cover_image_url = $4, og_image_url = $5 where id = $1`,
      [row.id, final.generated_image_url, final.preview_image_url, final.cover_image_url, final.og_image_url]
    );
  }

  return { totalWithSupabaseImages: total, processed: rows.length, migratedImages: migrated, unavailableImages: dropped };
}

// Correction for an article where the AI added a wrong year after a month
// ("December 2023" or "December 17-18, 2023" in a 2026 story). With --to=<YYYY>
// the year is replaced, otherwise it is removed ("December 2023" -> "December").
// Applies to all text fields; the slug (URL) is kept so links don't break.
async function fixYears() {
  const { query } = await import("../src/lib/db");
  const slug = readFlag("slug", "");
  const year = readFlag("year", "");
  const to = readFlag("to", "");

  if (!slug || !/^(19|20)\d{2}$/.test(year) || (to && !/^(19|20)\d{2}$/.test(to))) {
    throw new Error("Usage: fix-years --slug=<slug> --year=<YYYY> [--to=<YYYY>]");
  }

  const months = "January|February|March|April|May|June|July|August|September|October|November|December";
  const pattern = new RegExp(`\\b(${months})(\\s+\\d{1,2}(?:\\s*[-–]\\s*\\d{1,2})?)?,?\\s+${year}\\b`, "g");
  const replace = (_match, month, day = "") => (to ? `${month}${day}${day ? "," : ""} ${to}` : `${month}${day}`);
  const fix = (value) => {
    if (typeof value === "string") return value.replace(pattern, replace);
    if (Array.isArray(value)) return value.map(fix);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fix(item)]));
    return value;
  };
  const { rows } = await query(
    `select id, title, dek, summary, content, why_it_matters, meta_title, meta_description, key_points from news_items where slug = $1`,
    [slug]
  );
  const row = rows[0];

  if (!row) {
    throw new Error(`No article with slug ${slug}`);
  }

  const replacements = (JSON.stringify(row).match(pattern) || []).length;
  const fixed = fix(row);

  await query(
    `update news_items set title = $2, dek = $3, summary = $4, content = $5, why_it_matters = $6, meta_title = $7, meta_description = $8, key_points = $9::jsonb where id = $1`,
    [row.id, fixed.title, fixed.dek, fixed.summary, fixed.content, fixed.why_it_matters, fixed.meta_title, fixed.meta_description, JSON.stringify(fixed.key_points ?? [])]
  );

  return { slug, replacements, title: fixed.title };
}

const tasks = {
  async generate() {
    const { runGeneratePipeline } = await import("../src/lib/pipeline");
    return runGeneratePipeline(Number(readFlag("count", "1")) || 1);
  },
  async images() {
    const { markJobLifecycle, runGenerateImagesJob } = await import("../src/lib/pipeline");
    return markJobLifecycle("image", () => runGenerateImagesJob());
  },
  async publish() {
    const { markJobLifecycle, runPublishJob } = await import("../src/lib/pipeline");
    return markJobLifecycle("publish", () => runPublishJob());
  },
  "world-digest": worldDigest,
  async "seo-refresh"() {
    const { refreshPublishedSeoContent } = await import("../src/lib/seo-refresh");
    return refreshPublishedSeoContent();
  },
  "ensure-schema": ensureSchema,
  fingerprint,
  "repair-images": repairImages,
  "fix-years": fixYears
};

async function main() {
  const taskName = process.argv[2];
  const task = tasks[taskName];

  if (!task) {
    throw new Error(`Unknown task "${taskName}". Use one of: ${Object.keys(tasks).join(", ")}`);
  }

  const startedAt = Date.now();
  const result = await task();
  console.log(JSON.stringify({ ok: true, task: taskName, seconds: Math.round((Date.now() - startedAt) / 1000), result }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[automation] ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exit(1);
  });
