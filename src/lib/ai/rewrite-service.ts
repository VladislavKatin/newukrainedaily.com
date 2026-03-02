import "server-only";
import { getRewriteProvider } from "@/lib/ai/provider";
import { rewriteOutputSchema, type RewriteOutput } from "@/lib/ai/rewrite-schema";
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
  return snippet.length >= 120 && countSentences(snippet) >= 2;
}

export async function rewriteRawNews(raw: NewsRawRecord): Promise<RewriteOutput | null> {
  if (!isRewriteCandidate(raw)) {
    return null;
  }

  const provider = getRewriteProvider();
  const rewritten = await provider.rewriteNews({
    raw,
    sourceText: buildRewriteSourceText(raw),
    sourceName: raw.sourceName || "Unknown Source",
    sourceUrl: raw.url
  });

  if (!rewritten) {
    return null;
  }

  return rewriteOutputSchema.parse(rewritten);
}
