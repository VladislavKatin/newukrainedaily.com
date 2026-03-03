import { NextResponse } from "next/server";
import { authorizeCron, runCronStep } from "@/lib/cron";
import { ingestRssSources } from "@/lib/ingestion/rss";
import { markJobLifecycle } from "@/lib/pipeline";

async function runFetch(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runCronStep("fetch-news", "fetch", () =>
    markJobLifecycle("fetch", ingestRssSources)
  );
}

export async function GET(request: Request) {
  try {
    return await runFetch(request);
  } catch (error) {
    console.error("fetch-news error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown fetch-news error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
