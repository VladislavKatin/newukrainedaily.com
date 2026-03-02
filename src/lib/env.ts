import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PUBLIC_BASE_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  SUPABASE_STORAGE_PUBLIC_URL: z.string().url().optional(),
  AI_PROVIDER: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  LEONARDO_API_KEY: z.string().min(1).optional(),
  LEONARDO_WEBHOOK_SECRET: z.string().min(1).optional(),
  DAILY_PUBLISH_LIMIT: z.coerce.number().int().positive().optional(),
  AUTOPOST_DRY_RUN: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === true || value === "true";
    })
});

const parsedEnv = envSchema.parse(process.env);

const requiredKeys = [
  "PUBLIC_BASE_URL",
  "CRON_SECRET",
  "AI_PROVIDER",
  "AI_API_KEY",
  "LEONARDO_API_KEY",
  "LEONARDO_WEBHOOK_SECRET",
  "DAILY_PUBLISH_LIMIT",
  "AUTOPOST_DRY_RUN"
] as const;

type RequiredKey = (typeof requiredKeys)[number];

function getMissingKeys(keys: readonly RequiredKey[]) {
  return keys.filter((key) => {
    const value = parsedEnv[key];
    return value === undefined || value === "";
  });
}

export function validateEnv() {
  const missing = [...getMissingKeys(requiredKeys)] as string[];
  const hasDatabaseUrl = Boolean(parsedEnv.DATABASE_URL || parsedEnv.SUPABASE_DATABASE_URL);

  if (!hasDatabaseUrl) {
    missing.push("DATABASE_URL");
  }

  if (missing.length === 0) {
    return { ok: true as const, missing: [] as string[] };
  }

  if (parsedEnv.NODE_ENV === "development") {
    console.warn(`[env] Missing required variables: ${missing.join(", ")}`);
    return { ok: false as const, missing };
  }

  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export function requireEnv<Key extends RequiredKey>(key: Key) {
  const value = parsedEnv[key];

  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getDatabaseUrl() {
  const databaseUrl = parsedEnv.DATABASE_URL || parsedEnv.SUPABASE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL or SUPABASE_DATABASE_URL");
  }

  return databaseUrl;
}

export function getEnv() {
  return parsedEnv;
}
