import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { inspectRssSources } from "@/lib/ingestion/rss";

export async function GET(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const sourceLimit = Number.parseInt(new URL(request.url).searchParams.get("limit") || "50", 10);
    const itemsPerSourceLimit = Number.parseInt(
      new URL(request.url).searchParams.get("itemsPerSourceLimit") || "25",
      10
    );

    const result = await inspectRssSources({
      sourceLimit: Number.isFinite(sourceLimit) ? sourceLimit : 50,
      itemsPerSourceLimit: Number.isFinite(itemsPerSourceLimit) ? itemsPerSourceLimit : 25
    });

    return NextResponse.json({
      ...result,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("[internal/source-health] failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to inspect source health"
      },
      { status: 500 }
    );
  }
}
