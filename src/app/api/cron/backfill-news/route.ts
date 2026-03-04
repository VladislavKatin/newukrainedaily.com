import { NextResponse } from "next/server";
import { authorizeCron, cronStatus, methodNotAllowed } from "@/lib/cron";
import { backfillNewsImagesAndSeo } from "@/lib/news-backfill";

export function GET(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  return cronStatus("backfill-news");
}

export function PUT() {
  return methodNotAllowed("backfill-news");
}

export function PATCH() {
  return methodNotAllowed("backfill-news");
}

export function DELETE() {
  return methodNotAllowed("backfill-news");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  let limit = 200;
  try {
    const body = (await request.json()) as { limit?: number };
    if (body?.limit && Number.isFinite(body.limit)) {
      limit = Math.max(1, Math.min(1000, Math.floor(body.limit)));
    }
  } catch {
    limit = 200;
  }

  try {
    const result = await backfillNewsImagesAndSeo(limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] backfill-news failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Backfill failed"
      },
      { status: 500 }
    );
  }
}
