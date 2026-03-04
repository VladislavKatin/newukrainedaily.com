import "server-only";
import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { isUkraineRelevantFeedItem, sourceLikelyUkraineFocused } from "@/lib/content-relevance";
import { extractMainImage } from "@/lib/ingestion/main-image";
import { normalizeCanonicalUrl } from "@/lib/news-normalization";
import { createRawNews, listActiveSources } from "@/lib/postgres-repository";

type ParsedFeedItem = {
  raw: Record<string, unknown>;
  title: string;
  url: string;
  canonicalUrl: string | null;
  contentSnippet: string | null;
  publishedAt: string | null;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true
});

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

function normalizePublishedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function pickLinkValue(item: Record<string, unknown>) {
  const linkNode = item.link;

  if (typeof linkNode === "string") {
    return linkNode.trim() || null;
  }

  if (linkNode && typeof linkNode === "object") {
    const linkRecord = linkNode as Record<string, unknown>;
    const href =
      pickText(linkRecord.href) ||
      pickText(linkRecord.url) ||
      pickText(linkRecord["#text"]);

    if (href) {
      return href;
    }
  }

  const links = toArray(item.link as Record<string, unknown> | Record<string, unknown>[] | undefined);
  for (const link of links) {
    if (!link || typeof link !== "object") {
      continue;
    }

    const linkRecord = link as Record<string, unknown>;
    const rel = (pickText(linkRecord.rel) || "").toLowerCase();
    const href = pickText(linkRecord.href) || pickText(linkRecord.url) || pickText(linkRecord["#text"]);
    if (!href) {
      continue;
    }

    if (!rel || rel === "alternate" || rel === "canonical") {
      return href;
    }
  }

  return null;
}

function normalizeItem(item: Record<string, unknown>): ParsedFeedItem | null {
  const title = pickText(item.title) || "Untitled item";
  const url =
    pickLinkValue(item) ||
    pickText(item.guid) ||
    pickText((item.link as Record<string, unknown> | undefined)?.href);

  if (!url) {
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

  return {
    raw: item,
    title,
    url,
    canonicalUrl: normalizeCanonicalUrl(url),
    contentSnippet,
    publishedAt
  };
}

function extractItems(xml: string) {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rssItems = toArray(
    ((parsed.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined)
      ?.item as Record<string, unknown> | Record<string, unknown>[] | undefined
  );
  const atomItems = toArray(
    (parsed.feed as Record<string, unknown> | undefined)?.entry as
      | Record<string, unknown>
      | Record<string, unknown>[]
      | undefined
  );

  return [...rssItems, ...atomItems]
    .map(normalizeItem)
    .filter((item): item is ParsedFeedItem => item !== null);
}

function buildHash(input: ParsedFeedItem) {
  return crypto
    .createHash("sha256")
    .update(`${input.url}|${input.title}|${input.publishedAt ?? ""}`)
    .digest("hex");
}

export async function ingestRssSources(options?: {
  sourceLimit?: number;
  itemsPerSourceLimit?: number;
}) {
  const sourceLimit = options?.sourceLimit ?? 50;
  const itemsPerSourceLimit = options?.itemsPerSourceLimit ?? 25;
  const sources = (await listActiveSources(sourceLimit)).filter((source) => source.type === "rss");

  console.log(`[ingestion] fetch-news: rss sources=${sources.length}`);

  let scannedItems = 0;
  let newRecords = 0;
  let failedSources = 0;

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        method: "GET",
        headers: {
          "User-Agent": "newukrainedaily.com/0.1"
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        failedSources += 1;
        console.error(`[ingestion] source=${source.name} status=${response.status} url=${source.url}`);
        continue;
      }

      const xml = await response.text();
      const items = extractItems(xml)
        .filter((item) => sourceLikelyUkraineFocused(source) || isUkraineRelevantFeedItem(item))
        .slice(0, itemsPerSourceLimit);
      scannedItems += items.length;

      let sourceNewRecords = 0;
      let sourceItemErrors = 0;

      for (const item of items) {
        try {
          if (!isHttpUrl(item.url)) {
            sourceItemErrors += 1;
            console.warn(`[ingestion:item] source=${source.name} skipped invalid url=${item.url}`);
            continue;
          }

          const previewImage = await extractMainImage({
            rssItem: item.raw,
            articleUrl: item.url,
            feedUrl: source.url
          });

          const created = await createRawNews({
            sourceId: source.id,
            url: item.url,
            canonicalUrl: item.canonicalUrl,
            title: item.title,
            contentSnippet: item.contentSnippet,
            previewImageUrl: previewImage.url,
            previewImageMethod: previewImage.methodUsed,
            previewImageConfidence: previewImage.confidence,
            previewImageSource: source.name,
            previewImageCaption: previewImage.url
              ? `Preview: original image from ${source.name}`
              : null,
            publishedAt: item.publishedAt,
            hash: buildHash(item)
          });

          if (created) {
            newRecords += 1;
            sourceNewRecords += 1;
          }

          if (previewImage.url) {
            console.log(
              `[ingestion:image] source=${source.name} method=${previewImage.methodUsed} confidence=${previewImage.confidence.toFixed(
                2
              )} url=${previewImage.url}`
            );
          }
        } catch (error) {
          sourceItemErrors += 1;
          console.error(
            `[ingestion:item] source=${source.name} failed url=${item.url} reason=${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      console.log(
        `[ingestion] source=${source.name} items=${items.length} new=${sourceNewRecords} itemErrors=${sourceItemErrors}`
      );
    } catch (error) {
      failedSources += 1;
      console.error(
        `[ingestion] source=${source.name} failed=${
          error instanceof Error ? error.message : "Unknown error"
        } url=${source.url}`
      );
    }
  }

  console.log(
    `[ingestion] fetch-news completed: sources=${sources.length} scanned=${scannedItems} new=${newRecords} failed=${failedSources}`
  );

  return {
    ok: true,
    sources: sources.length,
    scannedItems,
    newRecords,
    failedSources
  };
}
