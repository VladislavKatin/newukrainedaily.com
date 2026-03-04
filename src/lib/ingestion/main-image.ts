import "server-only";

export type MainImageMethod =
  | "rss_media"
  | "rss_enclosure"
  | "og_image"
  | "twitter_image"
  | "jsonld_image"
  | "dom_fallback";

export type MainImageResult = {
  url: string | null;
  methodUsed: MainImageMethod | null;
  confidence: number;
};

type ExtractMainImageInput = {
  rssItem: Record<string, unknown>;
  articleUrl: string;
  feedUrl?: string;
};

type ImgCandidate = {
  url: string;
  width: number | null;
  height: number | null;
  insideArticle: boolean;
  fromPriorityContainer: boolean;
};

const EXCLUDED_IMAGE_PATTERN =
  /(logo|icon|avatar|sprite|banner|ads?|doubleclick|pixel|tracking|gravatar|emoji|placeholder)/i;

const PRIORITY_CONTAINER_PATTERN = /(article|content|post|entry|story|main|body|text)/i;

function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function getRecordValueAsString(record: Record<string, unknown>, key: string) {
  const value = record[key];

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

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function isLikelyTrackingPixel(url: string, width: number | null, height: number | null) {
  if (width !== null && height !== null && width <= 5 && height <= 5) {
    return true;
  }

  return /(pixel|spacer|tracking|analytics)/i.test(url);
}

function normalizeAbsoluteUrl(rawUrl: string | null | undefined, baseUrl?: string) {
  if (!rawUrl) {
    return null;
  }

  const cleaned = decodeHtmlEntities(rawUrl.trim());
  if (!cleaned || cleaned.startsWith("data:")) {
    return null;
  }

  try {
    if (cleaned.startsWith("//")) {
      return `https:${cleaned}`;
    }

    if (baseUrl) {
      const resolved = new URL(cleaned, baseUrl);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        return null;
      }

      return resolved.toString();
    }

    const parsed = new URL(cleaned);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([:@\w-]+)\s*=\s*(['"])(.*?)\2/g;

  for (const match of tag.matchAll(attributePattern)) {
    const key = match[1].toLowerCase();
    const value = decodeHtmlEntities(match[3].trim());
    attributes[key] = value;
  }

  return attributes;
}

function parseDimension(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function pickUrlFromSrcset(rawSrcset: string | undefined, baseUrl?: string) {
  if (!rawSrcset) {
    return null;
  }

  const parts = rawSrcset
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  let best: { url: string; weight: number } | null = null;

  for (const part of parts) {
    const [candidateUrl, descriptor] = part.split(/\s+/, 2);
    const normalized = normalizeAbsoluteUrl(candidateUrl, baseUrl);
    if (!normalized) {
      continue;
    }

    let weight = 1;
    if (descriptor?.endsWith("w")) {
      const parsed = Number.parseInt(descriptor.slice(0, -1), 10);
      if (Number.isFinite(parsed)) {
        weight = parsed;
      }
    }

    if (!best || weight > best.weight) {
      best = { url: normalized, weight };
    }
  }

  return best?.url ?? null;
}

function parseImgCandidatesFromHtml(html: string, baseUrl?: string): ImgCandidate[] {
  const candidates: ImgCandidate[] = [];
  const imgTagPattern = /<img\b[^>]*>/gi;

  for (const match of html.matchAll(imgTagPattern)) {
    const imgTag = match[0];
    const attrs = parseAttributes(imgTag);

    const directSrc = normalizeAbsoluteUrl(
      attrs.src || attrs["data-src"] || attrs["data-original"] || null,
      baseUrl
    );
    const srcsetSrc = pickUrlFromSrcset(attrs.srcset || attrs["data-srcset"], baseUrl);
    const candidateUrl = directSrc || srcsetSrc;

    if (!candidateUrl || EXCLUDED_IMAGE_PATTERN.test(candidateUrl)) {
      continue;
    }

    const width = parseDimension(attrs.width);
    const height = parseDimension(attrs.height);
    if (isLikelyTrackingPixel(candidateUrl, width, height)) {
      continue;
    }

    const index = match.index ?? 0;
    const contextStart = Math.max(0, index - 350);
    const context = html.slice(contextStart, index).toLowerCase();
    const insideArticle = /<article|<main|class=["'][^"']*(article|content|post|entry)[^"']*["']/.test(
      context
    );
    const fromPriorityContainer = PRIORITY_CONTAINER_PATTERN.test(context);

    candidates.push({
      url: candidateUrl,
      width,
      height,
      insideArticle,
      fromPriorityContainer
    });
  }

  return candidates;
}

function scoreCandidate(candidate: ImgCandidate) {
  let score = 0;

  if (candidate.insideArticle) {
    score += 0.35;
  }
  if (candidate.fromPriorityContainer) {
    score += 0.2;
  }
  if ((candidate.width ?? 0) >= 400 && (candidate.height ?? 0) >= 400) {
    score += 0.35;
  } else if ((candidate.width ?? 0) >= 400 || (candidate.height ?? 0) >= 400) {
    score += 0.2;
  }
  if (/\.(jpe?g|png|webp)(\?|$)/i.test(candidate.url)) {
    score += 0.1;
  }

  return score;
}

function pickBestDomCandidate(html: string, baseUrl?: string) {
  const candidates = parseImgCandidatesFromHtml(html, baseUrl);
  if (candidates.length === 0) {
    return null;
  }

  let best = candidates[0];
  let bestScore = scoreCandidate(best);

  for (const candidate of candidates.slice(1)) {
    const candidateScore = scoreCandidate(candidate);
    if (candidateScore > bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }

  return { candidate: best, score: bestScore };
}

function extractFromMediaNode(item: Record<string, unknown>) {
  const mediaNodes = [
    ...toArray(item["media:content"]),
    ...toArray(item["media:thumbnail"])
  ] as unknown[];

  for (const node of mediaNodes) {
    if (typeof node === "string") {
      const normalized = normalizeAbsoluteUrl(node);
      if (normalized && !EXCLUDED_IMAGE_PATTERN.test(normalized)) {
        return normalized;
      }
      continue;
    }

    if (!node || typeof node !== "object") {
      continue;
    }

    const record = node as Record<string, unknown>;
    const candidate =
      getRecordValueAsString(record, "url") ||
      getRecordValueAsString(record, "href") ||
      getRecordValueAsString(record, "src") ||
      getRecordValueAsString(record, "#text");
    const normalized = normalizeAbsoluteUrl(candidate);
    if (normalized && !EXCLUDED_IMAGE_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

function extractFromEnclosure(item: Record<string, unknown>) {
  const enclosures = toArray(item.enclosure) as unknown[];

  for (const enclosure of enclosures) {
    if (!enclosure || typeof enclosure !== "object") {
      continue;
    }

    const record = enclosure as Record<string, unknown>;
    const type = (getRecordValueAsString(record, "type") || "").toLowerCase();
    if (!type.startsWith("image/")) {
      continue;
    }

    const candidate =
      getRecordValueAsString(record, "url") ||
      getRecordValueAsString(record, "href") ||
      getRecordValueAsString(record, "src");
    const normalized = normalizeAbsoluteUrl(candidate);
    if (normalized && !EXCLUDED_IMAGE_PATTERN.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

function findMetaImage(
  html: string,
  predicate: (attrs: Record<string, string>) => boolean,
  baseUrl?: string
) {
  const metaPattern = /<meta\b[^>]*>/gi;
  for (const match of html.matchAll(metaPattern)) {
    const attrs = parseAttributes(match[0]);
    if (!predicate(attrs)) {
      continue;
    }

    const content = attrs.content || attrs.value;
    const normalized = normalizeAbsoluteUrl(content, baseUrl);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function collectImageFromJsonLdNode(node: unknown): string[] {
  if (!node || typeof node !== "object") {
    return [];
  }

  const record = node as Record<string, unknown>;
  const found: string[] = [];

  const append = (value: unknown) => {
    if (typeof value === "string") {
      found.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        append(entry);
      }
      return;
    }

    if (value && typeof value === "object") {
      const child = value as Record<string, unknown>;
      append(child.url);
      append(child.contentUrl);
      append(child["@id"]);
    }
  };

  append(record.image);
  append(record.primaryImageOfPage);

  if (Array.isArray(record["@graph"])) {
    for (const nodeInGraph of record["@graph"]) {
      found.push(...collectImageFromJsonLdNode(nodeInGraph));
    }
  }

  return found;
}

function findJsonLdImage(html: string, baseUrl: string) {
  const scripts = html.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/gi);

  for (const scriptMatch of scripts) {
    const rawJson = scriptMatch[1]?.trim();
    if (!rawJson) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const candidates = collectImageFromJsonLdNode(parsed);
      for (const candidate of candidates) {
        const normalized = normalizeAbsoluteUrl(candidate, baseUrl);
        if (normalized && !EXCLUDED_IMAGE_PATTERN.test(normalized)) {
          return normalized;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function confidenceFromDomScore(score: number) {
  if (score >= 0.8) {
    return 0.76;
  }
  if (score >= 0.5) {
    return 0.69;
  }
  return 0.62;
}

export async function extractMainImage(input: ExtractMainImageInput): Promise<MainImageResult> {
  const mediaImage = extractFromMediaNode(input.rssItem);
  if (mediaImage) {
    return { url: mediaImage, methodUsed: "rss_media", confidence: 0.95 };
  }

  const enclosureImage = extractFromEnclosure(input.rssItem);
  if (enclosureImage) {
    return { url: enclosureImage, methodUsed: "rss_enclosure", confidence: 0.9 };
  }

  const contentEncoded =
    getRecordValueAsString(input.rssItem, "content:encoded") ||
    getRecordValueAsString(input.rssItem, "description") ||
    getRecordValueAsString(input.rssItem, "content");

  if (contentEncoded) {
    const domCandidate = pickBestDomCandidate(contentEncoded, input.articleUrl || input.feedUrl);
    if (domCandidate) {
      return {
        url: domCandidate.candidate.url,
        methodUsed: "dom_fallback",
        confidence: confidenceFromDomScore(domCandidate.score)
      };
    }
  }

  try {
    const response = await fetch(input.articleUrl, {
      method: "GET",
      headers: { "User-Agent": "newukrainedaily.com/0.1" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return { url: null, methodUsed: null, confidence: 0 };
    }

    const html = await response.text();

    const ogImage = findMetaImage(
      html,
      (attrs) => attrs.property?.toLowerCase() === "og:image",
      input.articleUrl
    );
    if (ogImage) {
      return { url: ogImage, methodUsed: "og_image", confidence: 0.88 };
    }

    const twitterImage = findMetaImage(
      html,
      (attrs) =>
        attrs.name?.toLowerCase() === "twitter:image" ||
        attrs.property?.toLowerCase() === "twitter:image",
      input.articleUrl
    );
    if (twitterImage) {
      return {
        url: twitterImage,
        methodUsed: "twitter_image",
        confidence: 0.82
      };
    }

    const jsonLdImage = findJsonLdImage(html, input.articleUrl);
    if (jsonLdImage) {
      return {
        url: jsonLdImage,
        methodUsed: "jsonld_image",
        confidence: 0.78
      };
    }

    const fallbackDom = pickBestDomCandidate(html, input.articleUrl);
    if (fallbackDom) {
      return {
        url: fallbackDom.candidate.url,
        methodUsed: "dom_fallback",
        confidence: confidenceFromDomScore(fallbackDom.score)
      };
    }
  } catch {
    return { url: null, methodUsed: null, confidence: 0 };
  }

  return { url: null, methodUsed: null, confidence: 0 };
}
