import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const cwd = process.cwd();
loadLocalEnv(cwd);

const manifestArg = process.argv.find((arg) => arg.startsWith("--manifest="));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const manifestPath = manifestArg
  ? path.resolve(cwd, manifestArg.split("=")[1])
  : path.join(cwd, "scripts", "output", "blog-image-manifest.json");
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : 20;

const replicateApiToken = process.env.REPLICATE_API_TOKEN;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!replicateApiToken) {
  throw new Error("REPLICATE_API_TOKEN is required.");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadManifest() {
  const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) {
    throw new Error("Manifest must contain an items array.");
  }
  return { parsed, items };
}

function saveManifest(parsed) {
  fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2) + "\n");
}

function buildPrompt(item) {
  const title = normalizeText(item.title);
  const visualBrief = normalizeText(item.visualBrief);
  const basePrompt = normalizeText(item.prompt);
  return [
    basePrompt,
    `Topic context: ${title}.`,
    visualBrief ? `Visual goal: ${visualBrief}` : null,
    "Realistic documentary newsroom photography.",
    "Natural light, believable human expressions, real locations, editorial composition.",
    "No text, no logos, no watermark, no propaganda poster style, no fantasy, no collage, no split-screen."
  ]
    .filter(Boolean)
    .join(" ");
}

function extensionFromContentType(contentType, fallback = "jpg") {
  if (!contentType) return fallback;
  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return fallback;
}

function getR2StorageConfig() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET) {
    return null;
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    endpoint: process.env.R2_S3_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ? trimTrailingSlash(process.env.R2_PUBLIC_BASE_URL) : null
  };
}

function getSupabaseStorageConfig() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_STORAGE_BUCKET) {
    return null;
  }

  return {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET
  };
}

async function saveBufferAsset(buffer, fileStem, contentType, fallbackExtension) {
  const extension = extensionFromContentType(contentType, fallbackExtension);
  const fileName = `${fileStem}.${extension}`;
  const objectPath = `blog/generated/${fileName}`;
  const r2Config = getR2StorageConfig();

  if (r2Config) {
    const client = new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey
      }
    });

    await client.send(
      new PutObjectCommand({
        Bucket: r2Config.bucket,
        Key: objectPath,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable"
      })
    );

    if (!r2Config.publicBaseUrl) {
      throw new Error("R2 upload succeeded, but R2_PUBLIC_BASE_URL is missing.");
    }

    return { filePath: objectPath, publicUrl: `${r2Config.publicBaseUrl}/${objectPath}` };
  }

  const supabaseConfig = getSupabaseStorageConfig();
  if (supabaseConfig) {
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const upload = await supabase.storage.from(supabaseConfig.bucket).upload(objectPath, buffer, {
      contentType,
      upsert: true
    });

    if (upload.error) {
      throw new Error(`Supabase Storage upload failed: ${upload.error.message}`);
    }

    const publicUrlResult = supabase.storage.from(supabaseConfig.bucket).getPublicUrl(objectPath);
    return { filePath: objectPath, publicUrl: publicUrlResult.data.publicUrl };
  }

  const directory = path.join(cwd, "public", "generated", "blog");
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  fs.writeFileSync(filePath, buffer);
  const baseUrl = trimTrailingSlash(process.env.PUBLIC_BASE_URL || "https://www.newukrainedaily.com");
  return { filePath, publicUrl: `${baseUrl}/generated/blog/${fileName}` };
}

async function saveRemoteImage(imageUrl, fileStem) {
  const response = await fetch(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return saveBufferAsset(buffer, fileStem, response.headers.get("content-type") || "image/jpeg", "jpg");
}

async function createPrediction(prompt) {
  const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${replicateApiToken}`,
      "Content-Type": "application/json",
      "Prefer": "wait=60",
      "Cancel-After": "5m"
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: "16:9",
        num_outputs: 1,
        num_inference_steps: 28,
        guidance: 3.5,
        output_format: "jpg",
        output_quality: 90,
        disable_safety_checker: false
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(`Replicate prediction failed: ${response.status} ${message}`);
    error.status = response.status;
    try {
      const parsed = JSON.parse(message);
      error.retryAfter = Number(parsed.retry_after || 0);
    } catch {}
    throw error;
  }

  return response.json();
}

function extractOutputUrl(prediction) {
  const output = prediction?.output;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    return output.find((value) => typeof value === "string") || null;
  }
  return null;
}

async function pollPrediction(getUrl) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${replicateApiToken}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Replicate polling failed: ${response.status} ${await response.text()}`);
    }

    const prediction = await response.json();
    const outputUrl = extractOutputUrl(prediction);
    if (prediction.status === "succeeded" && outputUrl) {
      return outputUrl;
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Replicate generation ${prediction.status}: ${prediction.error || "unknown error"}`);
    }

    await sleep(3000);
  }

  throw new Error("Replicate generation timed out.");
}

async function createPredictionWithRetry(prompt) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      return await createPrediction(prompt);
    } catch (error) {
      const status = error?.status;
      const retryAfter = Number(error?.retryAfter || 0);
      if (status === 429) {
        const waitMs = Math.max(6000, (retryAfter || 6) * 1000 + 500);
        console.warn(`[replicate-blog-images] rate-limited, waiting ${waitMs}ms before retry`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }

  throw new Error("Replicate prediction retry limit exceeded.");
}

async function main() {
  const { parsed, items } = loadManifest();
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
    max: 3
  });

  try {
    let updated = 0;
    const baseTargets = items.filter((item) => normalizeText(item.slug));
    const filteredTargets = force
      ? baseTargets
      : baseTargets.filter((item) => !normalizeText(item.imageUrl));
    const targets = filteredTargets.slice(0, Number.isFinite(limit) && limit > 0 ? limit : filteredTargets.length);

    for (const item of targets) {
      const slug = normalizeText(item.slug);
      const prompt = buildPrompt(item);
      console.log(`[replicate-blog-images] generating slug=${slug}`);

      if (dryRun) {
        console.log(`[replicate-blog-images] dry-run prompt=${prompt}`);
        continue;
      }

      const prediction = await createPredictionWithRetry(prompt);
      let outputUrl = extractOutputUrl(prediction);
      if (!outputUrl && prediction?.urls?.get) {
        outputUrl = await pollPrediction(prediction.urls.get);
      }
      if (!outputUrl) {
        throw new Error(`No output image URL returned for ${slug}`);
      }

      const stored = await saveRemoteImage(outputUrl, `${slug}-${Date.now()}`);
      item.imageUrl = stored.publicUrl;
      saveManifest(parsed);

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
        [slug, stored.publicUrl, normalizeText(item.alt), `${normalizeText(item.title)} cover image`]
      );

      if (result.rowCount > 0) {
        updated += 1;
        console.log(`[replicate-blog-images] updated slug=${slug}`);
      } else {
        console.warn(`[replicate-blog-images] slug not found: ${slug}`);
      }

      await sleep(6500);
    }

    saveManifest(parsed);
    console.log(`[replicate-blog-images] complete updated=${updated}/${targets.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[replicate-blog-images] failed:", error);
  process.exitCode = 1;
});
