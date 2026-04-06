import "server-only";
import { getEnv } from "@/lib/env";

type WorldSummaryInput = {
  title: string;
  sourceName: string;
  sourceUrl: string;
  contentSnippet: string | null;
};

type WorldSummaryProvider = {
  summarize(input: WorldSummaryInput): Promise<string>;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampSummary(value: string) {
  const normalized = normalizeText(value);
  if (normalized.length < 150) {
    return `${normalized} This matters because it affects the wider international picture readers are following today.`.slice(0, 300).trim();
  }

  if (normalized.length <= 300) {
    return normalized;
  }

  return `${normalized.slice(0, 297).trimEnd()}...`;
}

function fallbackSummary(input: WorldSummaryInput) {
  const base = normalizeText(input.contentSnippet || input.title);
  const sentence = base || input.title;
  return clampSummary(`${sentence} This matters because it is part of the main international developments shaping today’s agenda.`);
}

class StubWorldSummaryProvider implements WorldSummaryProvider {
  async summarize(input: WorldSummaryInput) {
    return fallbackSummary(input);
  }
}

class OpenAiWorldSummaryProvider implements WorldSummaryProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async summarize(input: WorldSummaryInput) {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You write concise world news digest summaries in plain English. Output valid JSON only."
          },
          {
            role: "user",
            content: [
              "Write one factual world-news digest summary in 150 to 300 characters.",
              "Use 1 to 2 short sentences.",
              "Explain what happened and why it matters.",
              "Do not copy the source text directly.",
              "Do not add speculation or filler.",
              "Return strict JSON with one key: summary",
              `Title: ${input.title}`,
              `Source: ${input.sourceName}`,
              `Source URL: ${input.sourceUrl}`,
              `Snippet: ${input.contentSnippet || ""}`
            ].join("\n")
          }
        ]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`OpenAI world summary failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return fallbackSummary(input);
    }

    const parsed = JSON.parse(content) as { summary?: string };
    return clampSummary(parsed.summary || fallbackSummary(input));
  }
}

export function getWorldSummaryProvider(): WorldSummaryProvider {
  const env = getEnv();

  if (!env.AI_PROVIDER || env.AI_PROVIDER === "stub") {
    return new StubWorldSummaryProvider();
  }

  if (env.AI_PROVIDER.startsWith("openai") && env.AI_API_KEY) {
    const [, configuredModel] = env.AI_PROVIDER.split(":", 2);
    return new OpenAiWorldSummaryProvider(env.AI_API_KEY, configuredModel || DEFAULT_OPENAI_MODEL);
  }

  return new StubWorldSummaryProvider();
}
