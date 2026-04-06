import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { extractMainImage } from "@/lib/ingestion/main-image";
import { worldDigestDateFromDate } from "@/lib/world/date";

type WorldFeedSource = {
  name: string;
  url: string;
  kind: "direct" | "google";
};

export type WorldFeedCandidate = {
  id: string;
  title: string;
  normalizedTitle: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  contentSnippet: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  importanceScore: number;
  sourceKind: "direct" | "google";
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true
});

const WORLD_FEEDS: WorldFeedSource[] = [
  {
    name: "Google News World",
    url: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
    kind: "google"
  },
  {
    name: "Google News Top Stories",
    url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    kind: "google"
  },
  {
    name: "Reuters World",
    url: "https://feeds.reuters.com/Reuters/worldNews",
    kind: "direct"
  },
  {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    kind: "direct"
  },
  {
    name: "The Guardian World",
    url: "https://www.theguardian.com/world/rss",
    kind: "direct"
  }
];

const IMPORTANT_PATTERNS = [
  /\bwar\b/i,
  /\battack\b/i,
  /\bstrike\b/i,
  /\bmissile\b/i,
  /\bdrone\b/i,
  /\bsanctions?\b/i,
  /\bceasefire\b/i,
  /\bpeace talks?\b/i,
  /\bdiploma(cy|tic)\b/i,
  /\bpresident\b/i,
  /\bprime minister\b/i,
  /\bparliament\b/i,
  /\bgovernment\b/i,
  /\belection\b/i,
  /\btariffs?\b/i,
  /\btrade\b/i,
  /\beconom(y|ic)\b/i,
  /\binflation\b/i,
  /\brecession\b/i,
  /\bmarkets?\b/i,
  /\boil\b/i,
  /\bgas\b/i,
  /\benergy\b/i,
  /\bchina\b/i,
  /\brussia\b/i,
  /\bukraine\b/i,
  /\biran\b/i,
  /\bisrael\b/i,
  /\bgaza\b/i,
  /\bsyria\b/i,
  /\beu\b/i,
  /\bnato\b/i,
  /\bjerusalem\b/i,
  /\bpalestinian\b/i,
  /\bkorea\b/i,
  /\bhormuz\b/i,
  /\bshipping\b/i,
  /\bmilitary\b/i,
  /\bsecurity\b/i,
  /\barmed forces\b/i
];

const EXCLUDED_PATTERNS = [
  /\bsport\b/i,
  /\bfootball\b/i,
  /\btennis\b/i,
  /\bleague\b/i,
  /\brecipe\b/i,
  /\btravel\b/i,
  /\bcelebrity\b/i,
  /\bhoroscope\b/i,
  /\bweather\b/i,
  /\bmovie\b/i,
  /\bmovie review\b/i,
  /\bstyle\b/i,
  /\bfashion\b/i
];

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function pickText(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (value && typeof value === "object") {
    const textNode = (value as Record<string, unknown>)["#text"];
    if (typeof textNode === "string") {
      return textNode.trim() || null;
    }
  }

  return null;
}

function normalizeUrl(rawUrl: string | null, baseUrl: string) {
  if (!rawUrl) {
    return null;
  }

  try {
    if (rawUrl.startsWith("//")) {
      return `https:${rawUrl}`;
    }

    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function pickSourceName(source: WorldFeedSource, item: Record<string, unknown>, title: string) {
  const sourceNode = item.source;
  if (sourceNode && typeof sourceNode === "object") {
    const sourceTitle = pickText((sourceNode as Record<string, unknown>).title) || pickText(sourceNode);
    if (sourceTitle) {
      return sourceTitle;
    }
  }

  const titleParts = title.split(/\s+-\s+/);
  if (titleParts.length > 1) {
    const trailingSource = titleParts.at(-1)?.trim();
    if (trailingSource && trailingSource.length <= 60) {
      return trailingSource;
    }
  }

  return source.name;
}

function cleanTitle(title: string) {
  const parts = title.split(/\s+-\s+/);
  if (parts.length > 1) {
    return parts.slice(0, -1).join(" - ").trim() || title;
  }

  return title;
}

function pickLinkValue(item: Record<string, unknown>) {
  if (typeof item.link === "string") {
    return item.link.trim() || null;
  }

  const links = toArray(item.link as Record<string, unknown> | Record<string, unknown>[] | undefined);
  for (const link of links) {
    if (!link || typeof link !== "object") {
      continue;
    }

    const href = pickText((link as Record<string, unknown>).href) || pickText((link as Record<string, unknown>).url) || pickText((link as Record<string, unknown>)["#text"]);
    const rel = (pickText((link as Record<string, unknown>).rel) || "").toLowerCase();
    if (href && (!rel || rel === "alternate" || rel === "canonical")) {
      return href;
    }
  }

  return pickText(item.guid) || null;
}

function normalizePublishedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeTitle(title: string) {
  return String(title || "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeImportance(text: string, sourceName: string) {
  let score = 0;
  for (const pattern of IMPORTANT_PATTERNS) {
    if (pattern.test(text)) {
      score += 2;
    }
  }

  if (/google news/i.test(sourceName)) {
    score += 1;
  }

  if (/reuters|bbc|guardian/i.test(sourceName)) {
    score += 2;
  }

  if (/\bbreaking\b/i.test(text)) {
    score += 1;
  }

  return score;
}

function getSourcePriority(source: WorldFeedSource) {
  if (source.kind === "google") {
    return -6;
  }

  if (/reuters|bbc|guardian/i.test(source.name)) {
    return 4;
  }

  return 2;
}

function isRelevant(text: string) {
  if (!text) {
    return false;
  }

  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(text))) {
    return false;
  }

  return IMPORTANT_PATTERNS.some((pattern) => pattern.test(text));
}

function extractItems(xml: string) {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rssItems = toArray(((parsed.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined)?.item as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const atomItems = toArray((parsed.feed as Record<string, unknown> | undefined)?.entry as Record<string, unknown> | Record<string, unknown>[] | undefined);
  return [...rssItems, ...atomItems];
}

async function fetchFeed(source: WorldFeedSource) {
  const response = await fetch(source.url, {
    method: "GET",
    headers: { "User-Agent": "newukrainedaily.com/0.1" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`${source.name} HTTP ${response.status}`);
  }

  return response.text();
}

async function normalizeFeedItem(source: WorldFeedSource, item: Record<string, unknown>): Promise<WorldFeedCandidate | null> {
  const rawTitle = pickText(item.title) || "Untitled world item";
  const title = cleanTitle(rawTitle);
  const sourceUrl = normalizeUrl(pickLinkValue(item), source.url);

  if (!sourceUrl) {
    return null;
  }

  const contentSnippet =
    pickText(item.description) ||
    pickText(item.summary) ||
    pickText(item["content:encoded"]) ||
    null;

  const publishedAt = normalizePublishedAt(
    pickText(item.pubDate) || pickText(item.published) || pickText(item.updated) || null
  );

  const relevanceText = [title, contentSnippet || ""].join(" ");
  if (!isRelevant(relevanceText)) {
    return null;
  }

  const image = await extractMainImage({
    rssItem: item,
    articleUrl: sourceUrl,
    feedUrl: source.url
  });

  return {
    id: crypto.createHash("sha1").update(`${sourceUrl}|${title}`).digest("hex"),
    title,
    normalizedTitle: normalizeTitle(title),
    sourceName: pickSourceName(source, item, rawTitle),
    sourceUrl,
    publishedAt,
    contentSnippet,
    imageUrl: image.url,
    imageAlt: title,
    importanceScore: computeImportance(relevanceText, source.name) + getSourcePriority(source),
    sourceKind: source.kind
  };
}

export async function fetchFreshWorldFeedCandidates(options?: { digestDate?: string }) {
  const items: WorldFeedCandidate[] = [];
  const digestDate = options?.digestDate || null;
  const now = Date.now();
  const freshWindowMs = 24 * 60 * 60 * 1000;

  for (const source of WORLD_FEEDS) {
    try {
      const xml = await fetchFeed(source);
      const rawItems = extractItems(xml);
      const normalized = await Promise.all(rawItems.slice(0, 80).map((item) => normalizeFeedItem(source, item as Record<string, unknown>)));

      for (const item of normalized) {
        if (!item) {
          continue;
        }

        if (item.publishedAt) {
          const publishedTime = new Date(item.publishedAt).getTime();
          if (digestDate) {
            if (worldDigestDateFromDate(new Date(item.publishedAt)) !== digestDate) {
              continue;
            }
          } else if (now - publishedTime > freshWindowMs) {
            continue;
          }
        }

        items.push(item);
      }
    } catch (error) {
      console.error(`[world] feed failed ${source.name}`, error);
    }
  }

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const deduped = items
    .sort((left, right) => {
      const scoreDiff = right.importanceScore - left.importanceScore;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .filter((item) => {
      if (seenUrls.has(item.sourceUrl) || seenTitles.has(item.normalizedTitle)) {
        return false;
      }

      seenUrls.add(item.sourceUrl);
      seenTitles.add(item.normalizedTitle);
      return true;
    });

  const directCandidates = deduped.filter((item) => item.sourceKind === "direct");
  const googleFallbackCandidates = deduped.filter((item) => item.sourceKind === "google");

  return [...directCandidates, ...googleFallbackCandidates];
}
