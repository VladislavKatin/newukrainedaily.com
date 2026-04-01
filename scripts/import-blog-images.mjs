import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const cwd = process.cwd();
loadLocalEnv(cwd);

const manifestArg = process.argv.find((arg) => arg.startsWith("--manifest="));
const dryRun = process.argv.includes("--dry-run");
const manifestPath = manifestArg
  ? path.resolve(cwd, manifestArg.split("=")[1])
  : path.join(cwd, "scripts", "output", "blog-image-manifest.json");

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) {
    throw new Error("Manifest must contain an items array.");
  }

  return items.map((item) => ({
    slug: normalizeText(item.slug),
    imageUrl: normalizeText(item.imageUrl),
    alt: normalizeText(item.alt),
    title: normalizeText(item.title)
  }));
}

async function main() {
  const items = loadManifest().filter((item) => item.slug && item.imageUrl);
  if (items.length === 0) {
    console.log(`[import-blog-images] no items with imageUrl found in ${manifestPath}`);
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
    max: 3
  });

  try {
    let updated = 0;

    for (const item of items) {
      if (dryRun) {
        console.log(`[import-blog-images] dry-run slug=${item.slug} imageUrl=${item.imageUrl}`);
        updated += 1;
        continue;
      }

      const result = await pool.query(
        `
          update blog_posts
          set
            cover_image_url = $2,
            og_image_url = $2,
            og_image_alt = coalesce(nullif($3, ''), og_image_alt, $4),
            updated_at = timezone('utc', now())
          where slug = $1
          returning slug
        `,
        [item.slug, item.imageUrl, item.alt, `${item.title} cover image`]
      );

      if (result.rowCount > 0) {
        updated += 1;
        console.log(`[import-blog-images] updated slug=${item.slug}`);
      } else {
        console.warn(`[import-blog-images] slug not found: ${item.slug}`);
      }
    }

    console.log(`[import-blog-images] complete updated=${updated}/${items.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[import-blog-images] failed:", error);
  process.exitCode = 1;
});
