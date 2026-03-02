import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { handleLeonardoWebhook } from "@/lib/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${requireEnv("LEONARDO_WEBHOOK_SECRET")}`;

  if (authHeader !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Record<string, unknown>;
  const result = await handleLeonardoWebhook(payload);

  return NextResponse.json(result, { status: result.ok ? 200 : 202 });
}

