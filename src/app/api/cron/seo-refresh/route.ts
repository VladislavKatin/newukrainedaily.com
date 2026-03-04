import { NextResponse } from "next/server";
import { authorizeCron, cronStatus, methodNotAllowed } from "@/lib/cron";
import { refreshPublishedSeoContent } from "@/lib/seo-refresh";

export function GET(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  return cronStatus("seo-refresh");
}

export function PUT() {
  return methodNotAllowed("seo-refresh");
}

export function PATCH() {
  return methodNotAllowed("seo-refresh");
}

export function DELETE() {
  return methodNotAllowed("seo-refresh");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await refreshPublishedSeoContent();
    console.log(
      `[cron] seo-refresh completed news=${result.updatedNews}/${result.totalNews} blog=${result.updatedBlog}/${result.totalBlog}`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] seo-refresh failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to refresh SEO content"
      },
      { status: 500 }
    );
  }
}
