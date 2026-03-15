import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

type Flags = {
  dryRun: boolean;
  limit: number;
};

function parseFlags(argv: string[]): Flags {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const parsedLimit = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 500;

  return {
    dryRun,
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 500
  };
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
  for (const fileName of [".env.local", ".env", ".env.vercel.prod", ".env.vercel"]) {
    loadEnvFile(path.join(cwd, fileName));
  }
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
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });

  const { saveRemoteImage } = await import("@/lib/storage");

  try {
    const { rows } = await pool.query<{
      id: string;
      slug: string;
      generated_image_url: string | null;
      cover_image_url: string | null;
      og_image_url: string | null;
    }>(
      `
        select id, slug, generated_image_url, cover_image_url, og_image_url
        from news_items
        where generated_image_url like '%supabase.co/storage/v1/object/public/%'
        order by published_at desc nulls last, created_at desc
        limit $1
      `,
      [flags.limit]
    );

    let migrated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.generated_image_url) {
        skipped += 1;
        continue;
      }

      const fileStem = `${row.id}-r2-migrated`;
      console.log(`[migrate-generated-images-to-r2] slug=${row.slug} dryRun=${flags.dryRun}`);

      if (flags.dryRun) {
        continue;
      }

      const stored = await saveRemoteImage(row.generated_image_url, fileStem);

      await pool.query(
        `
          update news_items
          set
            generated_image_url = $2,
            cover_image_url = case when cover_image_url = $3 then $2 else cover_image_url end,
            og_image_url = case when og_image_url = $3 then $2 else og_image_url end,
            updated_at = timezone('utc', now())
          where id = $1
        `,
        [row.id, stored.publicUrl, row.generated_image_url]
      );

      await pool.query(
        `
          update news_images
          set
            local_path = $2,
            local_image_url = $3,
            updated_at = timezone('utc', now())
          where news_item_id = $1
        `,
        [row.id, stored.filePath, stored.publicUrl]
      );

      migrated += 1;
    }

    console.log(JSON.stringify({ ok: true, dryRun: flags.dryRun, found: rows.length, migrated, skipped }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[migrate-generated-images-to-r2] failed:", error);
  process.exitCode = 1;
});
