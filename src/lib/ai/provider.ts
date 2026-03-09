import "server-only";
import { getEnv } from "@/lib/env";
import type { NewsRawRecord } from "@/lib/postgres-repository";
import { rewriteOutputSchema, type RewriteOutput } from "@/lib/ai/rewrite-schema";

export type RewriteInput = {
  raw: NewsRawRecord;
  sourceText: string;
  sourceName: string;
  sourceUrl: string;
  siteContext: string;
};

export type RewriteProvider = {
  rewriteNews(input: RewriteInput): Promise<RewriteOutput | null>;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function clampText(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 3).trim()}...`;
}

function countCharactersWithoutSpaces(value: string) {
  return normalizeText(value).replace(/\s+/g, "").length;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/,|\r?\n+/)
      : [];

  return Array.from(
    new Set(
      items
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .map((item) => clampText(item, maxLength))
    )
  ).slice(0, maxItems);
}

function sanitizeRewriteOutput(value: unknown) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const title = clampText(normalizeText(record.title), 70);
  const metaTitle = clampText(normalizeText(record.meta_title || record.title), 70);
  const metaDescription = clampText(normalizeText(record.meta_description), 170);
  const lede = clampText(normalizeText(record.lede), 400);
  const whyItMatters = clampText(normalizeText(record.why_it_matters), 1000);
  const imagePrompt = clampText(normalizeText(record.image_prompt), 500);
  const imageAlt = clampText(normalizeText(record.image_alt), 140);
  const slug = clampText(normalizeText(record.slug), 90);
  const location = clampText(normalizeText(record.location), 120);

  return {
    ...record,
    title,
    meta_title: metaTitle,
    meta_description: metaDescription,
    lede,
    body: normalizeText(record.body),
    why_it_matters: whyItMatters,
    key_points: normalizeStringList(record.key_points, 6, 220),
    tags: normalizeStringList(record.tags, 10, 32),
    topics: normalizeStringList(record.topics, 6, 32),
    entities: normalizeStringList(record.entities, 12, 64),
    primary_topic: clampText(normalizeText(record.primary_topic), 32),
    image_prompt: imagePrompt,
    image_alt: imageAlt,
    slug,
    location: location || undefined
  };
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildStubRewrite(input: RewriteInput): RewriteOutput | null {
  const sentences = splitSentences(input.sourceText);
  const body = [
    `According to ${input.sourceName}, ${input.raw.title}.`,
    sentences[0] || "",
    sentences[1] || "",
    `The source frames this as part of the wider Ukraine news cycle and the article remains tightly limited to what the source itself reports.`,
    `According to the source, the reported development fits into the broader context of Ukraine-related diplomacy, security, humanitarian pressure, and state response.`,
    `This draft is intentionally restrained: it avoids adding figures, timelines, or claims that are not clearly present in the source material, while still giving readers enough editorial context to understand why the update matters within the wider Ukraine file.`
  ]
    .filter(Boolean)
    .join("\n\n")
    .repeat(2);

  if (countCharactersWithoutSpaces(body) < 1500) {
    return null;
  }

  return rewriteOutputSchema.parse({
    title: clampText(input.raw.title, 70),
    meta_title: clampText(input.raw.title, 70),
    meta_description: clampText(`According to ${input.sourceName}, ${input.raw.title}.`, 160),
    lede: clampText(`According to ${input.sourceName}, ${input.raw.title}.`, 300),
    body,
    why_it_matters:
      "This matters because it adds source-based context to the Ukraine news cycle and gives readers a clearer editorial summary of the latest development.",
    key_points: [
      `Source: ${input.sourceName}`,
      `Primary development: ${input.raw.title}`,
      "The article stays strictly within source-backed reporting."
    ],
    tags: ["ukraine", "news", "source-report", "editorial"],
    topics: ["Ukraine"],
    entities: [input.sourceName, "Ukraine"],
    primary_topic: "Ukraine",
    image_prompt:
      "Photorealistic editorial image for a Ukraine news article, symbolic civic or institutional scene, no text, no gore, cinematic 16:9 composition, natural lighting, high detail.",
    image_alt: `${input.raw.title} illustration`,
    slug: input.raw.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    location: "Ukraine"
  });
}

function getOpenAiModel(provider: string) {
  const [, configuredModel] = provider.split(":", 2);
  return configuredModel || DEFAULT_OPENAI_MODEL;
}

function buildOpenAiPrompt(input: RewriteInput) {
  return [
    "You are writing for New Ukraine Daily, an English-language newsroom site.",
    "Write like a skilled digital news editor: natural, precise, calm, and publication-ready.",
    "Use only source-backed facts. Do not invent numbers, quotes, or events.",
    "Do not sound translated, synthetic, bureaucratic, academic, or over-smoothed.",
    "Avoid machine-style filler, 'As an AI', 'In conclusion', 'it is worth noting', 'moreover', 'this development highlights', 'As the situation continues to develop', 'This underscores', and similar stock phrases.",
    "If the source is limited, stay careful and attribute with 'according to the source' or 'reportedly'.",
    "Keep the article on the topic of Ukraine and the direct reported development.",
    "Return strict JSON only, with no markdown.",
    "",
    "Required JSON schema keys:",
    "title, meta_title, meta_description, lede, body, why_it_matters, key_points, tags, topics, entities, primary_topic, image_prompt, image_alt, slug, location",
    "",
    "Constraints:",
    "- title <= 70 chars",
    "- meta_title <= 70 chars",
    "- meta_description 80-170 chars",
    "- lede 1-2 sentences, strong and direct, answering what happened / where / who said it when possible",
    "- body 4-7 readable paragraphs and at least 1500 characters without spaces",
    "- why_it_matters 2-3 sentences",
    "- key_points 3-6 items",
    "- tags/topics/entities concise and relevant",
    "- image_prompt must be 1-2 sentences, based on lead and body facts rather than headline alone, realistic editorial illustration, not documentary photo, no text on image, safe, 16:9, muted colors, high detail",
    "- image_prompt should describe the likely setting or visual context supported by the article facts: infrastructure, institutional setting, urban aftermath, or symbolic factual context",
    "",
    "Editorial quality rules:",
    "- Open with the central fact, not throat-clearing.",
    "- Keep one main point per paragraph.",
    "- Vary sentence length naturally.",
    "- Add brief context only when it helps the reader understand the significance.",
    "- End cleanly without generic conclusions.",
    "- Keep names, institutions, and country references natural; avoid repetitive repetition.",
    "- Never output one giant wall-of-text paragraph.",
    "",
    `Site context: ${input.siteContext}`,
    `Source name: ${input.sourceName}`,
    `Source URL: ${input.sourceUrl}`,
    "Source text:",
    input.sourceText
  ].join("\n");
}

class StubRewriteProvider implements RewriteProvider {
  async rewriteNews(input: RewriteInput) {
    return buildStubRewrite(input);
  }
}

class OpenAiRewriteProvider implements RewriteProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}

  async rewriteNews(input: RewriteInput) {
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
            content:
              "You are a strict editorial newswriter. Output valid JSON only and follow the exact schema requested."
          },
          {
            role: "user",
            content: buildOpenAiPrompt(input)
          }
        ]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const message = await response.text();
      if (response.status === 429) {
        throw new Error(`OpenAI rate limit reached: ${message}`);
      }
      throw new Error(`OpenAI rewrite failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };

    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content || content === "null") {
      return null;
    }

    const parsed = JSON.parse(content);
    return rewriteOutputSchema.parse(sanitizeRewriteOutput(parsed));
  }
}

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();

  if (!env.AI_PROVIDER || env.AI_PROVIDER === "stub") {
    return new StubRewriteProvider();
  }

  if (env.AI_PROVIDER.startsWith("openai")) {
    const apiKey = env.AI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when AI_PROVIDER is set to openai.");
    }

    return new OpenAiRewriteProvider(apiKey, getOpenAiModel(env.AI_PROVIDER));
  }

  throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
}
