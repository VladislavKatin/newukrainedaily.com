import "server-only";
import crypto from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { createRawNews, listActiveSources } from "@/lib/postgres-repository";

type ParsedFeedItem = {
  title: string;
  url: string;
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

function normalizeItem(item: Record<string, unknown>): ParsedFeedItem | null {
  const title = pickText(item.title) || "Untitled item";
  const url =
    pickText(item.link) ||
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

  const publishedAt =
    pickText(item.pubDate) ||
    pickText(item.published) ||
    pickText(item.updated) ||
    null;

  return {
    title,
    url,
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

export async function ingestRssSources() {
  const sources = (await listActiveSources()).filter((source) => source.type === "rss");

  console.log(`[ingestion] fetch-news: rss sources=${sources.length}`);

  let scannedItems = 0;
  let newRecords = 0;

  for (const source of sources) {
    const response = await fetch(source.url, {
      method: "GET",
      headers: {
        "User-Agent": "newukrainedaily.com/0.1"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      console.error(`[ingestion] source=${source.name} status=${response.status} url=${source.url}`);
      continue;
    }

    const xml = await response.text();
    const items = extractItems(xml);
    scannedItems += items.length;

    let sourceNewRecords = 0;

    for (const item of items) {
      const created = await createRawNews({
        sourceId: source.id,
        url: item.url,
        title: item.title,
        contentSnippet: item.contentSnippet,
        publishedAt: item.publishedAt,
        hash: buildHash(item)
      });

      if (created) {
        newRecords += 1;
        sourceNewRecords += 1;
      }
    }

    console.log(
      `[ingestion] source=${source.name} items=${items.length} new=${sourceNewRecords}`
    );
  }

  console.log(
    `[ingestion] fetch-news completed: sources=${sources.length} scanned=${scannedItems} new=${newRecords}`
  );

  return {
    ok: true,
    sources: sources.length,
    scannedItems,
    newRecords
  };
}
