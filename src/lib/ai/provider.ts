import "server-only";
import { getEnv } from "@/lib/env";
import type { NewsRawRecord } from "@/lib/postgres-repository";
import { rewriteOutputSchema, type RewriteOutput } from "@/lib/ai/rewrite-schema";

export type RewriteInput = {
  raw: NewsRawRecord;
  sourceText: string;
  sourceName: string;
  sourceUrl: string;
};

export type RewriteProvider = {
  rewriteNews(input: RewriteInput): Promise<RewriteOutput | null>;
};

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function words(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function hasLongCopiedSequence(sourceText: string, candidateText: string, maxWords = 12) {
  const sourceWords = words(sourceText);
  const candidateWords = words(candidateText);

  if (sourceWords.length < maxWords || candidateWords.length < maxWords) {
    return false;
  }

  const sourceSequences = new Set<string>();
  for (let i = 0; i <= sourceWords.length - maxWords; i += 1) {
    sourceSequences.add(sourceWords.slice(i, i + maxWords).join(" "));
  }

  for (let i = 0; i <= candidateWords.length - maxWords; i += 1) {
    if (sourceSequences.has(candidateWords.slice(i, i + maxWords).join(" "))) {
      return true;
    }
  }

  return false;
}

function cleanSnippet(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function buildStubRewrite(input: RewriteInput): RewriteOutput | null {
  const cleaned = cleanSnippet(input.sourceText);
  const sentences = splitIntoSentences(cleaned);

  if (cleaned.length < 120 || sentences.length < 2) {
    return null;
  }

  const titleBase = `${input.raw.title} update`;
  const title = titleBase.length <= 90 ? titleBase : `${titleBase.slice(0, 87).trim()}...`;
  const dek = `Draft based on reporting from ${input.sourceName}.`;
  const summary = [
    `This draft summarizes reporting from ${input.sourceName} about ${input.raw.title.toLowerCase()}.`,
    `The source indicates: ${sentences[0]}`,
    sentences[1]
      ? `A second reported point is that ${sentences[1].charAt(0).toLowerCase()}${sentences[1].slice(1)}`
      : `The available source material remains limited, so the draft stays tightly scoped to what is stated.`,
    `Source: ${input.sourceName} (${input.sourceUrl})`
  ].slice(0, 4);

  const keyPoints = [
    `Source identified: ${input.sourceName}.`,
    `Primary subject: ${input.raw.title}.`,
    `Reported detail: ${sentences[0]}`,
    sentences[1] || "Additional detail in the source was limited.",
    `Reference link: ${input.sourceUrl}`
  ].slice(0, 5);

  const whyItMatters = [
    `This story matters because it contributes directly to the running news file and should be reviewed before publication.`,
    `Editors should confirm the scope, attribution, and framing against the source link: ${input.sourceUrl}`
  ];

  const tags = Array.from(
    new Set(
      [
        "ukraine",
        "news",
        "analysis",
        "source-report",
        "editorial-review",
        input.sourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      ].filter(Boolean)
    )
  ).slice(0, 6);

  const output: RewriteOutput = {
    title,
    dek,
    summary,
    keyPoints,
    whyItMatters,
    tags,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    language: "en"
  };

  const combinedCandidateText = [
    output.title,
    output.dek,
    ...output.summary,
    ...output.keyPoints,
    ...output.whyItMatters
  ].join(" ");

  if (hasLongCopiedSequence(cleaned, combinedCandidateText)) {
    return null;
  }

  return rewriteOutputSchema.parse(output);
}

class StubRewriteProvider implements RewriteProvider {
  async rewriteNews(input: RewriteInput) {
    return buildStubRewrite(input);
  }
}

function getOpenAiModel(provider: string) {
  const [, configuredModel] = provider.split(":", 2);
  return configuredModel || DEFAULT_OPENAI_MODEL;
}

function buildOpenAiPrompt(input: RewriteInput) {
  return [
    "Rewrite the source into a strict JSON object for an English-language news site.",
    "Rules:",
    "- Do not add facts not present in the source.",
    "- Do not copy more than 12 consecutive words from the source.",
    "- Keep attribution explicit.",
    "- If the source is too thin, return null.",
    "- title must be unique-ready and at most 90 characters.",
    "- dek must be one line.",
    "- summary must contain 2 to 4 paragraphs.",
    "- keyPoints must contain 3 to 5 bullets.",
    "- whyItMatters must contain 1 to 2 paragraphs.",
    "- tags must contain 5 to 10 concise lowercase tags.",
    "- sourceName and sourceUrl must be preserved.",
    "- language must be en.",
    "",
    "Return JSON with exactly these keys:",
    "title, dek, summary, keyPoints, whyItMatters, tags, sourceName, sourceUrl, language",
    "",
    `Source name: ${input.sourceName}`,
    `Source url: ${input.sourceUrl}`,
    "Source text:",
    input.sourceText
  ].join("\n");
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
              "You are a strict newsroom rewrite assistant. Output valid JSON only. If source material is too thin, output null."
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

    const parsed = JSON.parse(content) as RewriteOutput;
    return rewriteOutputSchema.parse(parsed);
  }
}

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();

  if (!env.AI_PROVIDER || env.AI_PROVIDER === "stub") {
    return new StubRewriteProvider();
  }

  if (env.AI_PROVIDER.startsWith("openai")) {
    if (!env.AI_API_KEY) {
      throw new Error("AI_API_KEY is required when AI_PROVIDER is set to openai.");
    }

    return new OpenAiRewriteProvider(env.AI_API_KEY, getOpenAiModel(env.AI_PROVIDER));
  }

  throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
}
