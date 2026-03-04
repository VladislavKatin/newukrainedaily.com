import "server-only";
import { z } from "zod";

function normalizeOptionalString(value: unknown) {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
}

function optionalString(schema: z.ZodString) {
  return z.preprocess(normalizeOptionalString, schema.optional());
}

function optionalBooleanString() {
  return z
    .preprocess(
      normalizeOptionalString,
      z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional()
    )
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === true || value === "true";
    });
}

function optionalPositiveInt() {
  return z.preprocess(normalizeOptionalString, z.coerce.number().int().positive().optional());
}

function optionalNonNegativeInt() {
  return z.preprocess(normalizeOptionalString, z.coerce.number().int().min(0).optional());
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PUBLIC_BASE_URL: optionalString(z.string().url()),
  GOOGLE_SITE_VERIFICATION: optionalString(z.string().min(1)),
  GOOGLE_ANALYTICS_ID: optionalString(z.string().min(1)),
  CRON_SECRET: optionalString(z.string().min(1)),
  DATABASE_URL: optionalString(z.string().min(1)),
  DIRECT_URL: optionalString(z.string().min(1)),
  SUPABASE_DATABASE_URL: optionalString(z.string().min(1)),
  SUPABASE_URL: optionalString(z.string().url()),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(z.string().min(1)),
  SUPABASE_STORAGE_BUCKET: optionalString(z.string().min(1)),
  SUPABASE_STORAGE_PUBLIC_URL: optionalString(z.string().url()),
  AI_PROVIDER: optionalString(z.string().min(1)),
  AI_API_KEY: optionalString(z.string().min(1)),
  OPENAI_API_KEY: optionalString(z.string().min(1)),
  LEONARDO_API_KEY: optionalString(z.string().min(1)),
  LEONARDO_WEBHOOK_SECRET: optionalString(z.string().min(1)),
  LOCAL_PREVIEW_CONTENT: optionalBooleanString(),
  DAILY_PUBLISH_LIMIT: optionalPositiveInt(),
  AUTOPOST_DRY_RUN: optionalBooleanString(),
  AUTPOST_DRY_RUN: optionalBooleanString(),
  FETCH_SOURCES_LIMIT: optionalPositiveInt(),
  FETCH_ITEMS_PER_SOURCE_LIMIT: optionalPositiveInt(),
  REWRITE_BATCH_LIMIT: optionalPositiveInt(),
  REWRITE_REQUEST_SPACING_MS: optionalNonNegativeInt(),
  IMAGE_BATCH_LIMIT: optionalPositiveInt(),
  IMAGE_MAX_ATTEMPTS: optionalPositiveInt(),
  IMAGE_STALE_MINUTES: optionalPositiveInt(),
  IMAGE_REQUEST_SPACING_MS: optionalNonNegativeInt(),
  PUBLISH_BATCH_LIMIT: optionalPositiveInt()
  ,
  ARTICLES_PER_DAY: optionalPositiveInt(),
  MIN_ARTICLE_LENGTH: optionalPositiveInt(),
  INTERNAL_LINKS_COUNT: optionalPositiveInt()
});

const parsedEnv = envSchema.parse(process.env);

const publicRequiredKeys = [] as const;
const pipelineRequiredKeys = [
  "CRON_SECRET",
  "AI_PROVIDER",
  "LEONARDO_API_KEY",
  "LEONARDO_WEBHOOK_SECRET",
  "DAILY_PUBLISH_LIMIT",
  "AUTOPOST_DRY_RUN"
] as const;

type RequiredKey = (typeof publicRequiredKeys)[number] | (typeof pipelineRequiredKeys)[number];

function getMissingKeys(keys: readonly RequiredKey[]) {
  return keys.filter((key) => {
    const value = parsedEnv[key];
    return value === undefined || value === "";
  });
}

export function validateEnv(scope: "public" | "pipeline" = "public") {
  const missing =
    scope === "pipeline"
      ? ([...getMissingKeys(pipelineRequiredKeys)] as string[])
      : ([...getMissingKeys(publicRequiredKeys)] as string[]);

  if (scope === "pipeline") {
    const hasDatabaseUrl = Boolean(parsedEnv.DATABASE_URL || parsedEnv.SUPABASE_DATABASE_URL);

    if (!hasDatabaseUrl) {
      missing.push("DATABASE_URL");
    }

    if (
      parsedEnv.AI_PROVIDER &&
      parsedEnv.AI_PROVIDER !== "stub" &&
      !parsedEnv.AI_API_KEY &&
      !parsedEnv.OPENAI_API_KEY
    ) {
      missing.push("OPENAI_API_KEY");
    }
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
  const databaseUrl = parsedEnv.DATABASE_URL || parsedEnv.DIRECT_URL || parsedEnv.SUPABASE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL or SUPABASE_DATABASE_URL");
  }

  return databaseUrl;
}

export function getEnv() {
  return {
    ...parsedEnv,
    AI_API_KEY: parsedEnv.AI_API_KEY || parsedEnv.OPENAI_API_KEY,
    AUTOPOST_DRY_RUN: parsedEnv.AUTOPOST_DRY_RUN ?? parsedEnv.AUTPOST_DRY_RUN
  };
}
