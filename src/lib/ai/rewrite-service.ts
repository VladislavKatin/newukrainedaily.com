import "server-only";
import { isUkraineRelevantRaw } from "@/lib/content-relevance";
import { getRewriteProvider, type RewriteInput } from "@/lib/ai/provider";
import { assertRewriteBodyLength, rewriteOutputSchema, type RewriteOutput } from "@/lib/ai/rewrite-schema";
import type { NewsRawRecord } from "@/lib/postgres-repository";

function normalizeWhitespace(text: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function cleanSnippet(text: string | null) {
  return normalizeWhitespace((text || "").replace(/<[^>]+>/g, " "));
}

function countSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;
}

export function buildRewriteSourceText(raw: NewsRawRecord) {
  return [raw.title, raw.contentSnippet || "", raw.sourceName || "", raw.url]
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .join("\n");
}

export function isRewriteCandidate(raw: NewsRawRecord) {
  const snippet = cleanSnippet(raw.contentSnippet);
  return isUkraineRelevantRaw(raw) && snippet.length >= 120 && countSentences(snippet) >= 2;
}

export function buildRewritePrompt(raw: NewsRawRecord, siteContext: string) {
  return {
    raw,
    sourceText: buildRewriteSourceText(raw),
    sourceName: raw.sourceName || "Unknown Source",
    sourceUrl: raw.sourceUrl || raw.url,
    siteContext
  };
}

async function attemptRewrite(input: RewriteInput) {
  const provider = getRewriteProvider();
  return provider.rewriteNews(input);
}

export async function rewriteRawNews(raw: NewsRawRecord): Promise<RewriteOutput | null> {
  if (!isRewriteCandidate(raw)) {
    return null;
  }

  const siteContext =
    "New Ukraine Daily publishes newsroom-style English articles about Ukraine, diplomacy, security, economy, energy, and humanitarian developments with strong SEO and internal linking.";
  const input = buildRewritePrompt(raw, siteContext);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rewritten = await attemptRewrite(input);

    if (!rewritten) {
      continue;
    }

    const normalized = rewriteOutputSchema.parse(rewritten);

    if (!assertRewriteBodyLength(normalized.body)) {
      continue;
    }

    return normalized;
  }

  return null;
}
