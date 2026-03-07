import "server-only";
import { isUkraineRelevantRaw } from "@/lib/content-relevance";
import { getRewriteProvider, type RewriteInput } from "@/lib/ai/provider";
import { assertRewriteBodyLength, rewriteOutputSchema, type RewriteOutput } from "@/lib/ai/rewrite-schema";
import type { NewsRawRecord } from "@/lib/postgres-repository";

const FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; NewUkraineDailyBot/1.0; +https://www.newukrainedaily.com)"
};

function normalizeWhitespace(text: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function cleanSnippet(text: string | null) {
  return normalizeWhitespace((text || "").replace(/<[^>]+>/g, " "));
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function countSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;
}

function stripHtmlToText(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<\/(p|div|section|article|h1|h2|h3|li|blockquote)>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
  );
}

function extractArticleTextFromHtml(html: string) {
  const articleMatches = Array.from(
    html.matchAll(/<(article|main|section)[^>]*>([\s\S]*?)<\/\1>/gi),
    (match) => stripHtmlToText(match[2] || "")
  ).filter((value) => value.length >= 180);

  if (articleMatches.length > 0) {
    return articleMatches
      .sort((left, right) => right.length - left.length)[0]
      .slice(0, 5000);
  }

  const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi), (match) =>
    stripHtmlToText(match[1] || "")
  ).filter((value) => value.length >= 50);

  return paragraphMatches.join("\n").slice(0, 5000);
}

async function fetchArticleContext(raw: NewsRawRecord) {
  const articleUrl = raw.url || raw.sourceUrl || raw.canonicalUrl;

  if (!articleUrl) {
    return "";
  }

  try {
    const response = await fetch(articleUrl, {
      headers: FETCH_HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000)
    });

    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    return extractArticleTextFromHtml(html);
  } catch (error) {
    console.warn(`[rewrite] article fetch failed raw=${raw.id} url=${articleUrl}`, error);
    return "";
  }
}

export async function buildRewriteSourceText(raw: NewsRawRecord) {
  const articleContext = await fetchArticleContext(raw);
  return [raw.title, raw.contentSnippet || "", articleContext, raw.sourceName || "", raw.url]
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)
    .join("\n");
}

export function isRewriteCandidate(raw: NewsRawRecord, sourceText: string) {
  const snippet = cleanSnippet(raw.contentSnippet);
  const normalizedSource = normalizeWhitespace(sourceText);
  const sourceHasEnoughSignal = normalizedSource.length >= 220 && countSentences(normalizedSource) >= 2;
  const snippetHasEnoughSignal = snippet.length >= 120 && countSentences(snippet) >= 2;

  return isUkraineRelevantRaw(raw) && (snippetHasEnoughSignal || sourceHasEnoughSignal);
}

export function buildRewritePrompt(raw: NewsRawRecord, siteContext: string) {
  return {
    raw,
    sourceText: "",
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
  const sourceText = await buildRewriteSourceText(raw);

  if (!isRewriteCandidate(raw, sourceText)) {
    console.warn(
      `[rewrite] skipped candidate raw=${raw.id} source=${raw.sourceName} title=${raw.title} sourceTextLength=${sourceText.length}`
    );
    return null;
  }

  const siteContext =
    "New Ukraine Daily publishes newsroom-style English articles about Ukraine, diplomacy, security, economy, energy, and humanitarian developments with strong SEO and internal linking.";
  const input = {
    ...buildRewritePrompt(raw, siteContext),
    sourceText
  };

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
