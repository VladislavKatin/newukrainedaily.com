import { NextResponse } from "next/server";
import { authorizeCron, methodNotAllowed } from "@/lib/cron";
import { runGeneratePipeline } from "@/lib/pipeline";

type GeneratePayload = {
  count?: number;
  sources?: string[];
};

function parsePayload(payload: GeneratePayload | null) {
  if (!payload) {
    return { count: 1, sources: [] as string[] };
  }

  if (payload.sources !== undefined) {
    if (!Array.isArray(payload.sources) || payload.sources.some((source) => typeof source !== "string")) {
      return null;
    }
  }

  if (!payload || payload.count === undefined) {
    return {
      count: 1,
      sources: payload.sources ?? []
    };
  }

  if (!Number.isFinite(payload.count)) {
    return null;
  }

  const normalized = Math.floor(payload.count);

  if (normalized < 1 || normalized > 10) {
    return null;
  }

  return {
    count: normalized,
    sources: payload.sources ?? []
  };
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

  const parsed = parsePayload(payload);

  if (parsed === null) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid payload. Use {\"count\":1} or {\"count\":1,\"sources\":[]} with sources as an array."
      },
      { status: 400 }
    );
  }

  try {
    const result = await runGeneratePipeline(parsed.count);

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
