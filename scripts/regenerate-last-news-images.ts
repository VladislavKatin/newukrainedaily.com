import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;
const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/generations";
type Flags = {
  dryRun: boolean;
  limit: number;
};

function parseFlags(argv: string[]): Flags {
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const parsedLimit = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 5;

  return {
    dryRun: argv.includes("--dry-run"),
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5
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
  for (const fileName of [".env.local", ".env", ".env.vercel.prod"]) {
    loadEnvFile(path.join(cwd, fileName));
  }
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function extractGenerationId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.generationId,
    (record.sdGenerationJob as Record<string, unknown> | undefined)?.generationId,
    (record.sdGenerationJob as Record<string, unknown> | undefined)?.id
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function getNestedRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractLeonardoResult(payload: Record<string, unknown>) {
  const data = getNestedRecord(payload.data);
  const object = getNestedRecord(data?.object);
  const sdGenerationJob = getNestedRecord(payload.sdGenerationJob);
  const generation = getNestedRecord(payload.generation);
  const generationByPk = getNestedRecord(payload.generations_by_pk);

  const candidates = [object, data, sdGenerationJob, generation, generationByPk, payload].filter(
    (value): value is Record<string, unknown> => Boolean(value)
  );

  const status =
    candidates
      .map((candidate) => toStringValue(candidate.status))
      .find(Boolean) || null;

  const rawImages = candidates.flatMap((candidate) => [
    ...toArray(getNestedRecord(candidate.images)?.images as unknown[] | undefined),
    ...toArray(candidate.images as unknown[] | undefined),
    ...toArray(candidate.generated_images as unknown[] | undefined)
  ]);

  const imageUrl =
    rawImages
      .map((item) => {
        const record = getNestedRecord(item);
        return (
          toStringValue(record?.url) ||
          toStringValue(record?.uri) ||
          toStringValue(record?.imageUrl)
        );
      })
      .find(Boolean) || null;

  const errorMessage =
    candidates
      .map((candidate) => toStringValue(candidate.error) || toStringValue(candidate.message))
      .find(Boolean) || null;

  return { status, imageUrl, errorMessage, payload };
}

async function createLeonardoGeneration(prompt: string, apiKey: string) {
  const response = await fetch(LEONARDO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 768,
      num_images: 1
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Leonardo create generation failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const generationId = extractGenerationId(payload);

  if (!generationId) {
    throw new Error("Leonardo response did not include a generation id.");
  }

  return { generationId, payload };
}

async function getLeonardoGeneration(generationId: string, apiKey: string) {
  const response = await fetch(`${LEONARDO_API_URL}/${generationId}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Leonardo generation lookup failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return extractLeonardoResult(payload);
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

  const leonardoApiKey = process.env.LEONARDO_API_KEY;

  if (!leonardoApiKey) {
    throw new Error("LEONARDO_API_KEY is required.");
  }

  const [{ buildNewsImagePromptPackage }, { saveRemoteImage, saveEditorialIllustration }] = await Promise.all([
    import("@/lib/image-prompt"),
    import("@/lib/storage")
  ]);

  try {
    const { rows } = await pool.query<{
      id: string;
      slug: string;
      title: string;
      dek: string | null;
      content: string | null;
      why_it_matters: string | null;
      tags: string[] | null;
      source_name: string | null;
      location: string | null;
      preview_image_url: string | null;
      cover_image_url: string | null;
      og_image_url: string | null;
      generated_image_url: string | null;
      generated_image_prompt: string | null;
      generated_image_alt: string | null;
    }>(
      `
        select
          id,
          slug,
          title,
          dek,
          content,
          why_it_matters,
          tags,
          source_name,
          location,
          preview_image_url,
          cover_image_url,
          og_image_url,
          generated_image_url,
          generated_image_prompt,
          generated_image_alt
        from news_items
        where status = 'published'
        order by published_at desc nulls last, created_at desc
        limit $1
      `,
      [flags.limit]
    );

    let completed = 0;

    for (const row of rows) {
      const imagePackage = buildNewsImagePromptPackage({
        title: row.title,
        lead: row.dek,
        body: row.content,
        whyItMatters: row.why_it_matters,
        tags: Array.isArray(row.tags) ? row.tags : [],
        sourceName: row.source_name,
        location: row.location
      });

      console.log(
        `[regenerate-last-news-images] slug=${row.slug} scene=${imagePackage.sceneType} dryRun=${flags.dryRun}`
      );
      console.log(`[regenerate-last-news-images] prompt=${imagePackage.prompt}`);

      if (flags.dryRun) {
        continue;
      }

      let generation;
      try {
        generation = await createLeonardoGeneration(imagePackage.prompt, leonardoApiKey);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Leonardo generation failed.";
        if (/not enough api tokens|rate limit/i.test(message)) {
          const fallback = await saveEditorialIllustration(`fallback-${row.id}-${Date.now()}`, {
            title: row.title,
            tags: Array.isArray(row.tags) ? row.tags : [],
            sourceName: row.source_name
          });
          await pool.query(`
            update news_items
            set
              generated_image_prompt = $2,
              generated_image_url = $3,
              generated_image_alt = $4,
              generated_image_caption = $5,
              cover_image_url = coalesce(preview_image_url, cover_image_url),
              og_image_url = coalesce(preview_image_url, og_image_url),
              updated_at = timezone('utc', now())
            where id = $1
          `, [row.id, imagePackage.prompt, fallback.publicUrl, imagePackage.alt, imagePackage.caption]);
          await pool.query(`
            insert into news_images (news_item_id, provider, prompt, status, attempts, remote_image_url, local_path, local_image_url, last_error)
            values ($1, 'fallback', $2, 'complete', coalesce((select attempts + 1 from news_images where news_item_id = $1), 1), $3, $4, $3, $5)
            on conflict (news_item_id) do update set
              provider = excluded.provider,
              prompt = excluded.prompt,
              status = excluded.status,
              attempts = news_images.attempts + 1,
              remote_image_url = excluded.remote_image_url,
              local_path = excluded.local_path,
              local_image_url = excluded.local_image_url,
              last_error = excluded.last_error,
              updated_at = timezone('utc', now())
          `, [row.id, imagePackage.prompt, fallback.publicUrl, fallback.filePath, message]);
          completed += 1;
          continue;
        }
        throw error;
      }

      await pool.query(
        `
          insert into news_images (
            news_item_id, provider, prompt, generation_id, status, attempts, last_error
          )
          values (
            $1, 'leonardo', $2, $3, 'requested',
            coalesce((select attempts + 1 from news_images where news_item_id = $1), 1),
            null
          )
          on conflict (news_item_id) do update set
            provider = excluded.provider,
            prompt = excluded.prompt,
            generation_id = excluded.generation_id,
            status = 'requested',
            attempts = news_images.attempts + 1,
            last_error = null,
            updated_at = timezone('utc', now())
        `,
        [row.id, imagePackage.prompt, generation.generationId]
      );

      await pool.query(
        `
          update news_items
          set
            generated_image_prompt = $2,
            generated_image_url = null,
            generated_image_alt = $3,
            generated_image_caption = $4,
            cover_image_url = coalesce(preview_image_url, cover_image_url),
            og_image_url = coalesce(preview_image_url, og_image_url),
            updated_at = timezone('utc', now())
          where id = $1
        `,
        [row.id, imagePackage.prompt, imagePackage.alt, imagePackage.caption]
      );

      let storedPublicUrl: string | null = null;
      let remoteImageUrl: string | null = null;

      for (let attempt = 0; attempt < 45; attempt += 1) {
        const generationStatus = await getLeonardoGeneration(generation.generationId, leonardoApiKey);

        if (generationStatus.imageUrl) {
          remoteImageUrl = generationStatus.imageUrl;
          const uniqueStem = `${row.id}-${generation.generationId.slice(0, 8)}`;
          const stored = await saveRemoteImage(generationStatus.imageUrl, uniqueStem);
          storedPublicUrl = stored.publicUrl;

          await pool.query(
            `
              update news_images
              set
                status = 'complete',
                remote_image_url = $2,
                local_path = $3,
                local_image_url = $4,
                webhook_payload = $5::jsonb,
                last_error = null,
                updated_at = timezone('utc', now())
              where news_item_id = $1
            `,
            [
              row.id,
              generationStatus.imageUrl,
              stored.filePath,
              stored.publicUrl,
              JSON.stringify(generationStatus.payload)
            ]
          );

          await pool.query(
            `
              update news_items
              set
                generated_image_prompt = $2,
                generated_image_url = $3,
                generated_image_alt = $4,
                generated_image_caption = $5,
                cover_image_url = coalesce(preview_image_url, $3, cover_image_url),
                og_image_url = coalesce(preview_image_url, $3, og_image_url),
                updated_at = timezone('utc', now())
              where id = $1
            `,
            [row.id, imagePackage.prompt, stored.publicUrl, imagePackage.alt, imagePackage.caption]
          );

          break;
        }

        if (
          generationStatus.status &&
          ["failed", "error"].includes(String(generationStatus.status).toLowerCase())
        ) {
          throw new Error(generationStatus.errorMessage || "Leonardo generation failed.");
        }

        await sleep(4000);
      }

      if (!storedPublicUrl || !remoteImageUrl) {
        await pool.query(
          `
            update news_images
            set
              status = 'failed',
              last_error = $2,
              updated_at = timezone('utc', now())
            where news_item_id = $1
          `,
          [row.id, "Leonardo generation timeout."]
        );
        throw new Error(`Leonardo generation timeout for ${row.slug}`);
      }

      completed += 1;
      await sleep(1500);
    }

    console.log(JSON.stringify({ ok: true, dryRun: flags.dryRun, processed: rows.length, completed }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[regenerate-last-news-images] failed:", error);
  process.exitCode = 1;
});

