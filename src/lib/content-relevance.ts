import "server-only";
import type { NewsRawRecord, SourceRecord } from "@/lib/postgres-repository";

const UKRAINE_PATTERNS = [
  /\bukraine\b/i,
  /\bukrainian\b/i,
  /\bkyiv\b/i,
  /\bkyiv's\b/i,
  /\bzelenskyy\b/i,
  /\bzelensky\b/i,
  /\bodesa\b/i,
  /\bkharkiv\b/i,
  /\bdnipro\b/i,
  /\bdonetsk\b/i,
  /\bluhansk\b/i,
  /\bcrimea\b/i,
  /\bzaporizhzhia\b/i,
  /\bkherson\b/i
];

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function matchesUkrainePattern(value: string) {
  return UKRAINE_PATTERNS.some((pattern) => pattern.test(value));
}

export function isUkraineRelevantText(value: string | null | undefined) {
  const text = normalize(value);
  return text.length > 0 && matchesUkrainePattern(text);
}

export function isUkraineRelevantRaw(raw: Pick<NewsRawRecord, "title" | "contentSnippet" | "url" | "sourceName">) {
  return [raw.title, raw.contentSnippet, raw.url, raw.sourceName].some((value) =>
    isUkraineRelevantText(value)
  );
}

export function isUkraineRelevantFeedItem(item: {
  title: string;
  contentSnippet: string | null;
  url: string;
}) {
  return [item.title, item.contentSnippet, item.url].some((value) => isUkraineRelevantText(value));
}

export function sourceLikelyUkraineFocused(source: Pick<SourceRecord, "name" | "url">) {
  return isUkraineRelevantText(source.name) || isUkraineRelevantText(source.url);
}
