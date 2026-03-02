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

export function getRewriteProvider(): RewriteProvider {
  const env = getEnv();

  if (!env.AI_PROVIDER || env.AI_PROVIDER === "stub") {
    return new StubRewriteProvider();
  }

  return new StubRewriteProvider();
}

