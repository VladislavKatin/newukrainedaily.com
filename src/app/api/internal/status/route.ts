import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getOperationalStatusSnapshot } from "@/lib/postgres-repository";

export async function GET(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const snapshot = await getOperationalStatusSnapshot();

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      snapshot
    });
  } catch (error) {
    console.error("[internal/status] failed to load operational snapshot", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load operational status"
      },
      { status: 503 }
    );
  }
}
