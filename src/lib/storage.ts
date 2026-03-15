import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import { getBaseUrl } from "@/lib/site";

function extensionFromContentType(contentType: string | null) {
  if (!contentType) {
    return "jpg";
  }

  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "jpg";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export async function saveRemoteImageToLocalPublic(imageUrl: string, fileStem: string) {
  const response = await fetch(imageUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const extension = extensionFromContentType(response.headers.get("content-type"));
  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = `${fileStem}.${extension}`;
  const directory = path.join(process.cwd(), "public", "generated");
  const filePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    filePath,
    publicUrl: `${getBaseUrl()}/generated/${fileName}`
  };
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
    endpoint:
      env.R2_S3_ENDPOINT || `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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

export async function saveRemoteImage(imageUrl: string, fileStem: string) {
  const response = await fetch(imageUrl, {
    method: "GET",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type");
  const extension = extensionFromContentType(contentType);
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
        ContentType: contentType || "image/jpeg",
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

    const upload = await supabase.storage
      .from(supabaseConfig.bucket)
      .upload(objectPath, buffer, {
        contentType: contentType || "image/jpeg",
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
