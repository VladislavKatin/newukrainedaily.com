import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

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
