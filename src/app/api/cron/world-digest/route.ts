import { NextResponse } from "next/server";
import { authorizeCron, cronStatus, methodNotAllowed } from "@/lib/cron";
import { generateWorldDigestForDate } from "@/lib/world/digest";
import { worldDigestDateFromDate } from "@/lib/world/date";

export function GET() {
  return cronStatus("world-digest");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const requestedDate = typeof body?.digestDate === "string" ? body.digestDate : worldDigestDateFromDate();
    const result = await generateWorldDigestForDate(requestedDate);
    return NextResponse.json({ ok: true, route: "world-digest", status: "completed", result });
  } catch (error) {
    console.error("[cron] world-digest failed", error);
    return NextResponse.json(
      {
        ok: false,
        route: "world-digest",
        status: "error",
        error: error instanceof Error ? error.message : "World digest failed"
      },
      { status: 500 }
    );
  }
}

export function PUT() {
  return methodNotAllowed("world-digest");
}
