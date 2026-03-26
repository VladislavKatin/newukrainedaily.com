import { NextResponse } from "next/server";
import { authorizeCron, cronStatus, runCronStep } from "@/lib/cron";
import { markJobLifecycle, runRewriteNewsJob } from "@/lib/pipeline";

type RewritePayload = {
  limit?: number;
};

function parseLimit(payload: RewritePayload | null) {
  if (!payload || payload.limit === undefined) {
    return 3;
  }

  if (!Number.isFinite(payload.limit)) {
    return null;
  }

  const normalized = Math.floor(payload.limit);
  if (normalized < 1 || normalized > 10) {
    return null;
  }

  return normalized;
}

export function GET() {
  return cronStatus("rewrite-news");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  let payload: RewritePayload | null = null;

  try {
    payload = (await request.json()) as RewritePayload;
  } catch {
    payload = null;
  }

  const limit = parseLimit(payload);

  if (limit === null) {
    return NextResponse.json(
      { ok: false, error: 'Invalid payload. Use {"limit":1..10}.' },
      { status: 400 }
    );
  }

  return runCronStep("rewrite-news", "rewrite", () =>
    markJobLifecycle("rewrite", () => runRewriteNewsJob(limit))
  );
}
