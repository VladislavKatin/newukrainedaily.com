import { NextResponse } from "next/server";
import { authorizeCron, methodNotAllowed } from "@/lib/cron";
import { runGeneratePipeline } from "@/lib/pipeline";

type GeneratePayload = {
  count?: number;
};

function parseCount(payload: GeneratePayload | null) {
  if (!payload || payload.count === undefined) {
    return 1;
  }

  if (!Number.isFinite(payload.count)) {
    return null;
  }

  const normalized = Math.floor(payload.count);

  if (normalized < 1 || normalized > 10) {
    return null;
  }

  return normalized;
}

export function GET() {
  return methodNotAllowed("generate");
}

export async function POST(request: Request) {
  const unauthorized = authorizeCron(request);

  if (unauthorized) {
    return unauthorized;
  }

  let payload: GeneratePayload | null = null;

  try {
    payload = (await request.json()) as GeneratePayload;
  } catch {
    payload = null;
  }

  const count = parseCount(payload);

  if (count === null) {
    return NextResponse.json(
      { ok: false, error: "Invalid count. Use a number between 1 and 10." },
      { status: 400 }
    );
  }

  try {
    const result = await runGeneratePipeline(count);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[generate] endpoint failed", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate article pipeline"
      },
      { status: 500 }
    );
  }
}
