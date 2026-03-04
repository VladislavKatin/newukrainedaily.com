import { NextResponse } from "next/server";
import { getEnv, requireEnv, validateEnv } from "@/lib/env";

export function authorizeCron(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = requireEnv("CRON_SECRET");

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function methodNotAllowed(route: string) {
  return NextResponse.json(
    {
      ok: false,
      route,
      error: "Method Not Allowed",
      message: "Use POST with Authorization: Bearer <CRON_SECRET>."
    },
    {
      status: 405,
      headers: {
        Allow: "POST"
      }
    }
  );
}

export function cronStatus(route: string) {
  const env = getEnv();
  const pipelineValidation = validateEnv("pipeline");

  return NextResponse.json({
    ok: true,
    route,
    method: "GET",
    accepts: "POST",
    authorization: "Bearer <CRON_SECRET>",
    environment: {
      publicBaseUrlConfigured: Boolean(env.PUBLIC_BASE_URL),
      databaseConfigured: Boolean(env.DATABASE_URL || env.SUPABASE_DATABASE_URL),
      cronSecretConfigured: Boolean(env.CRON_SECRET),
      aiProvider: env.AI_PROVIDER || null,
      aiApiKeyConfigured: Boolean(env.AI_API_KEY),
      leonardoApiKeyConfigured: Boolean(env.LEONARDO_API_KEY),
      leonardoWebhookSecretConfigured: Boolean(env.LEONARDO_WEBHOOK_SECRET),
      storageConfigured: Boolean(
        env.SUPABASE_URL &&
          env.SUPABASE_SERVICE_ROLE_KEY &&
          env.SUPABASE_STORAGE_BUCKET
      )
    },
    validation: {
      pipelineReady: pipelineValidation.ok,
      missing: pipelineValidation.missing
    }
  });
}

export async function runCronStep<T>(
  route: string,
  type: "fetch" | "rewrite" | "image" | "publish" | "autopost",
  runner: () => Promise<{ jobId: string; result: T }>
) {
  try {
    const execution = await runner();
    console.log(`[cron] ${route}: completed job ${execution.jobId}`);

    return NextResponse.json({
      ok: true,
      route,
      status: "completed",
      type,
      jobId: execution.jobId,
      result: execution.result
    });
  } catch (error) {
    console.error(`[cron] ${route}: failed to enqueue`, error);

    return NextResponse.json(
      {
        ok: false,
        route,
        status: "error",
        type,
        error: error instanceof Error ? error.message : "Failed to execute cron step"
      },
      { status: 503 }
    );
  }
}
