import "server-only";
import type { NewsRawRecord, SourceRecord } from "@/lib/postgres-repository";

const PRIMARY_UKRAINE_PATTERNS = [
  /\bukraine\b/i,
  /\bukrainian\b/i,
  /\bkyiv\b/i,
  /\bkyiv region\b/i,
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
  /\bdnipropetrovsk\b/i,
  /\bmykolaiv\b/i,
  /\bsumy\b/i,
  /\binternally displaced\b/i,
  /\bidp\b/i,
  /\boccupied territories\b/i,
  /\boccupied\b/i,
  /\bukrenergo\b/i,
  /\bukrainian forces\b/i,
  /\bukrainian military\b/i,
  /\bukrainian government\b/i,
  /\bukrainian president\b/i,
  /україн/i,
  /украин/i,
  /київ/i,
  /киев/i,
  /харків/i,
  /харьков/i,
  /одес/i,
  /дніпр/i,
  /днепр/i,
  /донецьк/i,
  /донецк/i,
  /луган/i,
  /крим/i,
  /запоріж/i,
  /запорож/i,
  /херсон/i,
  /миколаїв/i,
  /николаев/i,
  /сум(и|ы)/i,
  /переселен/i,
  /впо\b/i,
  /зелень?ськ/i,
  /зеленск/i
];

const SECONDARY_CONTEXT_PATTERNS = [
  /\bdrone\b/i,
  /\bmissile\b/i,
  /\bstrike\b/i,
  /\battack\b/i,
  /\bceasefire\b/i,
  /\bnegotiation\b/i,
  /\btalks\b/i,
  /\bdiplomacy\b/i,
  /\bkremlin\b/i,
  /\brussia\b/i,
  /\brussian\b/i,
  /\bmoscow\b/i,
  /\bputin\b/i,
  /\bsanctions\b/i,
  /\bmilitary aid\b/i,
  /\bair defense\b/i,
  /\bfrontline\b/i,
  /\breconstruction\b/i,
  /\brecovery\b/i,
  /\bhumanitarian\b/i,
  /\benergy grid\b/i
  ,
  /дрон/i,
  /ракет/i,
  /обстріл/i,
  /обстрел/i,
  /переговор/i,
  /допомог/i,
  /відновлен/i,
  /восстановлен/i,
  /енергет/i,
  /кремл/i,
  /росі/i,
  /росси/i,
  /путін/i,
  /путин/i
];

const EXCLUDED_PATTERNS = [
  /\bsport\b/i,
  /\bsports\b/i,
  /\bfootball\b/i,
  /\btennis\b/i,
  /\bmatch\b/i,
  /\btournament\b/i,
  /\bleague\b/i,
  /\bchampionship\b/i,
  /\bbiathlon\b/i,
  /\bcup\b/i,
  /\bhoroscope\b/i,
  /\bastrology\b/i,
  /\bdiet\b/i,
  /\bhealth tips\b/i,
  /\brecipe\b/i,
  /\bcooking\b/i,
  /\btravel\b/i,
  /\bsafest city\b/i,
  /\blongevity\b/i,
  /\bchildren for longevity\b/i,
  /\bpotato\b/i,
  /\bcardiologists\b/i,
  /\bsudoku\b/i,
  /\brunes?\b/i,
  /\bcelebrity\b/i,
  /\bshowbiz\b/i
  ,
  /\bmuay thai\b/i,
  /\bwomen'?s day\b/i,
  /\b8 march\b/i,
  /\b8 bereznya\b/i,
  /\bden ukrainskoi zhinki\b/i,
  /спорт/i,
  /футбол/i,
  /теніс/i,
  /теннис/i,
  /матч/i,
  /турнір/i,
  /турнир/i,
  /чемпіонат/i,
  /чемпионат/i,
  /гороскоп/i,
  /астрол/i,
  /дієт/i,
  /диет/i,
  /здоров.?я/i,
  /здоров/i,
  /приготуван/i,
  /путешеств/i,
  /подорож/i,
  /8 березня/i
];

const UKRAINE_FOCUSED_DOMAINS = [
  "president.gov.ua",
  "mod.gov.ua",
  "mfa.gov.ua",
  "cabinet.gov.ua",
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

function matchesPrimarySignal(value: string) {
  return PRIMARY_UKRAINE_PATTERNS.some((pattern) => pattern.test(value));
}

function countSecondarySignals(value: string) {
  return SECONDARY_CONTEXT_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(value) ? 1 : 0),
    0
  );
}

function matchesExcludedPattern(value: string) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(value));
}

function isUkraineRelevantNormalizedText(value: string) {
  if (!value || matchesExcludedPattern(value)) {
    return false;
  }

  if (matchesPrimarySignal(value)) {
    return true;
  }

  return countSecondarySignals(value) >= 2 && /\bukrain/i.test(value);
}

export function isUkraineRelevantText(value: string | null | undefined) {
  return isUkraineRelevantNormalizedText(normalize(decodeHtmlEntities(value || "")));
}

export function isUkraineRelevantRaw(
  raw: Pick<NewsRawRecord, "title" | "contentSnippet" | "url" | "sourceName">
) {
  const combinedText = [raw.title, raw.contentSnippet, raw.url]
    .map((value) => normalize(decodeHtmlEntities(value || "")))
    .filter(Boolean)
    .join(" ");

  return isUkraineRelevantNormalizedText(combinedText);
}

export function isUkraineRelevantFeedItem(item: {
  title: string;
  contentSnippet: string | null;
  url: string;
}) {
  const combinedText = [item.title, item.contentSnippet, item.url]
    .map((value) => normalize(decodeHtmlEntities(value || "")))
    .filter(Boolean)
    .join(" ");

  return isUkraineRelevantNormalizedText(combinedText);
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
