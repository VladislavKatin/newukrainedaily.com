import "server-only";
import type { NewsRawRecord, SourceRecord } from "@/lib/postgres-repository";

const UKRAINE_PATTERNS = [
  /\bukraine\b/i,
  /\bukrainian\b/i,
  /\bkyiv region\b/i,
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
  /\bkherson\b/i,
  /\bfrontline\b/i,
  /\bdrone\b/i,
  /\bmissile\b/i,
  /\benergy grid\b/i,
  /\baid\b/i,
  /\bdiplomacy\b/i,
  /\bceasefire\b/i,
  /\bkremlin\b/i,
  /\brussia\b/i,
  /\brussian\b/i,
  /\bmoscow\b/i,
  /\bputin\b/i,
  /\bkharkiv region\b/i,
  /\bkherson region\b/i,
  /\bdnipropetrovsk\b/i,
  /\boccupied\b/i,
  /\boccupied territories\b/i,
  /\bair defense\b/i,
  /укра(ї|и)н/i,
  /украин/i,
  /ки(ї|е)в/i,
  /харків/i,
  /харьков/i,
  /одес/i,
  /дніпр/i,
  /днепр/i,
  /херсон/i,
  /запоріж/i,
  /запорож/i,
  /доне(ць|ц)к/i,
  /луган/i,
  /крим/i,
  /рос(і|и)я/i,
  /россий/i,
  /рф\b/i,
  /кремл/i,
  /путін/i,
  /путин/i,
  /зеленськ/i,
  /зеленск/i,
  /безпілот/i,
  /бпла/i,
  /дрон/i,
  /ракет/i,
  /обстр(і|е)л/i,
  /переговор/i,
  /допомог/i,
  /відновлен/i,
  /енергет/i,
  /впо\b/i,
  /переселен/i
];

const EXCLUDED_PATTERNS = [
  /\bsport\b/i,
  /\bsports\b/i,
  /\bfootball\b/i,
  /\bbiathlon\b/i,
  /\bcup\b/i,
  /\bhoroscope\b/i,
  /\bastrology\b/i,
  /\bdiet\b/i,
  /\bhealth tips\b/i,
  /\brecipe\b/i,
  /\btravel\b/i,
  /\bsafest city\b/i,
  /\blongevity\b/i,
  /\bchildren for longevity\b/i,
  /\bpotato\b/i,
  /\bcardiologists\b/i,
  /спорт/i,
  /біатлон/i,
  /футбол/i,
  /гороскоп/i,
  /астрол/i,
  /дієт/i,
  /картопл/i,
  /довголіт/i,
  /здоров.?я/i,
  /приготуван/i,
  /подорож/i,
  /місто в іспанії/i,
  /судоку/i,
  /руніч/i
];

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeUrlLike(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, "").trim().toLowerCase();
}

const UKRAINE_FOCUSED_DOMAINS = [
  "president.gov.ua",
  "mod.gov.ua",
  "mfa.gov.ua",
  "cabinet.gov.ua",
  "www.president.gov.ua",
  "www.mod.gov.ua",
  "www.mfa.gov.ua",
  "www.kmu.gov.ua",
  "pravda.com.ua",
  "epravda.com.ua",
  "ukrinform.net",
  "ukrinform.ua",
  "suspilne.media",
  "rbc.ua",
  "interfax.com.ua",
  "radiosvoboda.org",
  "nv.ua",
  "obozrevatel.com",
  "tsn.ua"
];

function matchesUkrainePattern(value: string) {
  return UKRAINE_PATTERNS.some((pattern) => pattern.test(value));
}

function matchesExcludedPattern(value: string) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(value));
}

export function isUkraineRelevantText(value: string | null | undefined) {
  const text = normalize(decodeHtmlEntities(value || ""));
  return text.length > 0 && !matchesExcludedPattern(text) && matchesUkrainePattern(text);
}

export function isUkraineRelevantRaw(raw: Pick<NewsRawRecord, "title" | "contentSnippet" | "url" | "sourceName">) {
  const combinedText = [raw.title, raw.contentSnippet, raw.url, raw.sourceName]
    .map((value) => normalize(decodeHtmlEntities(value || "")))
    .filter(Boolean)
    .join(" ");

  return combinedText.length > 0 && !matchesExcludedPattern(combinedText) && matchesUkrainePattern(combinedText);
}

export function isUkraineRelevantFeedItem(item: {
  title: string;
  contentSnippet: string | null;
  url: string;
}) {
  return [item.title, item.contentSnippet, item.url].some((value) => isUkraineRelevantText(value));
}

export function sourceLikelyUkraineFocused(source: Pick<SourceRecord, "name" | "url">) {
  const normalizedUrl = normalizeUrlLike(source.url);

  if (!normalizedUrl) {
    return false;
  }

  return (
    UKRAINE_FOCUSED_DOMAINS.some((domain) => normalizedUrl.includes(domain)) ||
    normalizedUrl.includes("/ukraine/") ||
    normalizedUrl.includes("keywordquery=ukraine") ||
    normalizedUrl.includes("search=ukraine") ||
    normalizedUrl.includes("qterm=ukraine")
  );
}
