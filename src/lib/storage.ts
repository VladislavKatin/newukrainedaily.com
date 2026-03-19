import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import { getBaseUrl } from "@/lib/site";

function extensionFromContentType(contentType: string | null, fallback = "jpg") {
  if (!contentType) {
    return fallback;
  }

  if (contentType.includes("svg")) return "svg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return fallback;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getR2StorageConfig() {
  const env = getEnv();

  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    return null;
  }

  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
    endpoint: env.R2_S3_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL ? trimTrailingSlash(env.R2_PUBLIC_BASE_URL) : null
  };
}

function getSupabaseStorageConfig() {
  const env = getEnv();

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_STORAGE_BUCKET) {
    return null;
  }

  return {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET
  };
}

async function saveBufferAsset(buffer: Buffer, fileStem: string, contentType: string, fallbackExtension: string) {
  const extension = extensionFromContentType(contentType, fallbackExtension);
  const fileName = `${fileStem}.${extension}`;
  const objectPath = `generated/${fileName}`;
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

    return {
      filePath: objectPath,
      publicUrl: `${r2Config.publicBaseUrl}/${objectPath}`
    };
  }

  const supabaseConfig = getSupabaseStorageConfig();

  if (supabaseConfig) {
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const upload = await supabase.storage.from(supabaseConfig.bucket).upload(objectPath, buffer, {
      contentType,
      upsert: true
    });

    if (upload.error) {
      throw new Error(`Supabase Storage upload failed: ${upload.error.message}`);
    }

    const publicUrlResult = supabase.storage.from(supabaseConfig.bucket).getPublicUrl(objectPath);
    const publicUrl = publicUrlResult.data.publicUrl;

    if (!publicUrl) {
      throw new Error("Supabase Storage did not return a public URL");
    }

    return {
      filePath: objectPath,
      publicUrl
    };
  }

  const directory = path.join(process.cwd(), "public", "generated");
  const filePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    filePath,
    publicUrl: `${getBaseUrl()}/generated/${fileName}`
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clampText(value: string, max: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

export async function saveRemoteImageToLocalPublic(imageUrl: string, fileStem: string) {
  const response = await fetch(imageUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveBufferAsset(buffer, fileStem, response.headers.get("content-type") || "image/jpeg", "jpg");
}

export async function saveRemoteImage(imageUrl: string, fileStem: string) {
  const response = await fetch(imageUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveBufferAsset(buffer, fileStem, response.headers.get("content-type") || "image/jpeg", "jpg");
}

export async function saveEditorialIllustration(
  fileStem: string,
  input: { title: string; tags?: string[]; sourceName?: string | null }
) {
  const title = escapeXml(clampText(input.title, 64));
  const tags = (input.tags || []).filter(Boolean).slice(0, 2).map((tag) => escapeXml(clampText(tag, 22)));
  const sourceName = escapeXml(clampText(input.sourceName || "Editorial Desk", 28));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect x="88" y="92" width="1424" height="716" rx="40" fill="#ffffff"/>
  <rect x="88" y="92" width="1424" height="28" fill="#1d4ed8" opacity="0.9"/>
  <circle cx="214" cy="274" r="86" fill="#bfdbfe"/>
  <rect x="344" y="218" width="884" height="36" rx="18" fill="#cbd5e1"/>
  <rect x="344" y="278" width="714" height="28" rx="14" fill="#e2e8f0"/>
  <rect x="214" y="420" width="1172" height="28" rx="14" fill="#dbeafe"/>
  <rect x="214" y="474" width="1098" height="24" rx="12" fill="#e2e8f0"/>
  <rect x="214" y="522" width="988" height="24" rx="12" fill="#e2e8f0"/>
  <rect x="214" y="636" width="264" height="58" rx="29" fill="#1d4ed8" opacity="0.16"/>
  <rect x="504" y="636" width="264" height="58" rx="29" fill="#1d4ed8" opacity="0.12"/>
  <text x="214" y="770" fill="#0f172a" font-family="Arial, sans-serif" font-size="48" font-weight="700">${title}</text>
  <text x="214" y="820" fill="#475569" font-family="Arial, sans-serif" font-size="24">${tags.join(" • ") || "Ukraine • Editorial Illustration"}</text>
  <text x="1340" y="820" text-anchor="end" fill="#64748b" font-family="Arial, sans-serif" font-size="20">${sourceName}</text>
</svg>`;

  return saveBufferAsset(Buffer.from(svg, "utf8"), fileStem, "image/svg+xml", "svg");
}
