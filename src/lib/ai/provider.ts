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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function normalizeMultilineText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countCharactersWithoutSpaces(value: string) {
  return value.replace(/\s+/g, "").length;
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

function buildStructuredBody(body: string, whyItMatters: string) {
  const normalized = normalizeMultilineText(body);
  if (/^##\s+/m.test(normalized)) {
    return normalized;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const sections = [
    { heading: "## What Happened", items: paragraphs.slice(0, 2) },
    { heading: "## Key Details", items: paragraphs.slice(2, 4) },
    { heading: "## Why It Matters", items: [whyItMatters || paragraphs[4] || ""] },
    { heading: "## Background", items: paragraphs.slice(4) }
  ].filter((section) => section.items.some(Boolean));

  return sections
    .map((section) => `${section.heading}\n\n${section.items.filter(Boolean).join("\n\n")}`)
    .join("\n\n")
    .trim();
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
  const rawBody = normalizeMultilineText(record.body);
  const body = buildStructuredBody(rawBody, whyItMatters);

  return {
    ...record,
    title,
    meta_title: metaTitle,
    meta_description: metaDescription,
    lede,
    body,
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
    "## What Happened",
    `According to ${input.sourceName}, ${input.raw.title}.`,
    sentences[0] || "",
    "## Key Details",
    sentences[1] || "",
    sentences[2] || "",
    "## Why It Matters",
    `The reported development adds to the current Ukraine news cycle and is presented here only within the limits of what ${input.sourceName} reported.`,
    "## Background",
    `This rewrite deliberately avoids unsupported details and keeps the focus on the source-backed facts that matter most to readers following Ukraine news.`
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
      "This matters because it gives readers a clear, source-backed explanation of the latest development without speculative filler or recycled phrasing.",
    key_points: [
      `Source: ${input.sourceName}`,
      `Primary development: ${input.raw.title}`,
      "The article stays strictly within source-backed reporting.",
      "The structure is optimized for readability and search clarity."
    ],
    tags: ["ukraine", "news", "source-report", "editorial"],
    topics: ["Ukraine"],
    entities: [input.sourceName, "Ukraine"],
    primary_topic: "Ukraine",
    image_prompt:
      "Realistic editorial illustration based on reported facts in the article, serious newsroom tone, muted colors, clear setting, no text, no logos, no gore, not a documentary photo.",
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
    "You are a senior editor writing for New Ukraine Daily, an English-language newsroom focused on Ukraine.",
    "Write in clear, factual, human editorial English.",
    "Do not sound generic, padded, machine-written, bureaucratic, or translated.",
    "Preserve only facts supported by the source.",
    "Do not invent numbers, quotes, motives, background, or chronology.",
    "If the source is limited, be careful and attribute plainly: 'according to the source' or 'the source said'.",
    "Avoid filler such as 'this highlights', 'this underscores', 'as the situation develops', 'it remains to be seen', 'moreover', 'in addition', and similar stock phrases.",
    "Do not repeat the same point in different wording.",
    "The article must read like a real edited news brief.",
    "Return strict JSON only. No markdown fences.",
    "",
    "Required JSON schema keys:",
    "title, meta_title, meta_description, lede, body, why_it_matters, key_points, tags, topics, entities, primary_topic, image_prompt, image_alt, slug, location",
    "",
    "Hard requirements:",
    "- title <= 70 chars and specific",
    "- meta_title <= 70 chars",
    "- meta_description 90-160 chars",
    "- lede 2-3 short sentences max, answering what happened, when, where, and who reported it where possible",
    "- body must be at least 1500 characters without spaces",
    "- body must use markdown-style H2 headings in this order when possible:",
    "  ## What Happened",
    "  ## Key Details",
    "  ## Why It Matters",
    "  ## Background",
    "- each paragraph should be short and readable, never one wall of text",
    "- why_it_matters must be 2-3 sentences and factual",
    "- key_points 3-6 items",
    "- tags/topics/entities concise and relevant",
    "- image_prompt must be based on article facts from the lead/body, not just the headline",
    "- image_prompt should describe a realistic editorial illustration, muted colors, serious tone, no text, no logos, no watermark, no gore, not a documentary photo",
    "",
    "Editorial rules:",
    "- Start with the central fact immediately.",
    "- Keep attribution clean and factual.",
    "- Prefer dense factual context over generic conclusions.",
    "- End cleanly without moralizing or filler.",
    "- The article should be useful to an international reader following Ukraine news.",
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
