import "server-only";
import { getEnv, requireEnv } from "@/lib/env";
import { extractLeonardoWebhookData } from "@/lib/leonardo/webhook";

const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1/generations";
const DEFAULT_MODEL_ID = "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3";

type LeonardoCreateRequest = {
  prompt: string;
};

function extractGenerationId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.generationId,
    (record.sdGenerationJob as Record<string, unknown> | undefined)?.generationId,
    (record.sdGenerationJob as Record<string, unknown> | undefined)?.id
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

export async function createLeonardoGeneration(input: LeonardoCreateRequest) {
  const env = getEnv();

  if (!env.PUBLIC_BASE_URL || !env.LEONARDO_WEBHOOK_SECRET) {
    console.warn(
      "[leonardo] PUBLIC_BASE_URL or LEONARDO_WEBHOOK_SECRET is missing. Leonardo webhook callbacks are configured on the production API key, not per request."
    );
  }

  const response = await fetch(LEONARDO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${requireEnv("LEONARDO_API_KEY")}`
    },
    body: JSON.stringify({
      prompt: input.prompt,
      modelId: DEFAULT_MODEL_ID,
      width: 1536,
      height: 1024,
      num_images: 1,
      presetStyle: "CINEMATIC"
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 429) {
      throw new Error(`Leonardo rate limit reached: ${message}`);
    }
    throw new Error(`Leonardo create generation failed: ${response.status} ${message}`);
  }

  const payload = (await response.json()) as unknown;
  const generationId = extractGenerationId(payload);

  if (!generationId) {
    throw new Error("Leonardo response did not include a generation id.");
  }

  return {
    generationId,
    payload
  };
}

export async function getLeonardoGeneration(generationId: string) {
  const response = await fetch(`${LEONARDO_API_URL}/${generationId}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${requireEnv("LEONARDO_API_KEY")}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 429) {
      throw new Error(`Leonardo rate limit reached: ${message}`);
    }
    throw new Error(`Leonardo generation lookup failed: ${response.status} ${message}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const parsed = extractLeonardoWebhookData(payload);

  return {
    ...parsed,
    payload
  };
}
