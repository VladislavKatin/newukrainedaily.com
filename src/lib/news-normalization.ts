import "server-only";

function normalizeWhitespace(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

export function normalizeCanonicalUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";

    let pathname = parsed.pathname.replace(/\/+/g, "/");
    if (pathname !== "/") {
      pathname = pathname.replace(/\/$/, "");
    }

    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${pathname}`;
  } catch {
    return normalizeWhitespace(url).toLowerCase() || null;
  }
}

export function publishDateBucket(value: string | null | undefined) {
  const parsed = value ? new Date(value) : new Date();

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

export function buildNewsFingerprint(input: {
  title: string;
  sourceName?: string | null;
  canonicalUrl?: string | null;
  publishedAt?: string | null;
}) {
  const normalizedTitle = normalizeWhitespace(input.title).toLowerCase();
  const normalizedSource = normalizeWhitespace(input.sourceName).toLowerCase();
  const canonicalUrl = normalizeCanonicalUrl(input.canonicalUrl);

  let mainPath = canonicalUrl || "";

  try {
    if (canonicalUrl) {
      mainPath = new URL(canonicalUrl).pathname.toLowerCase();
    }
  } catch {
    mainPath = canonicalUrl || "";
  }

  return [normalizedTitle, normalizedSource, mainPath, publishDateBucket(input.publishedAt)]
    .filter(Boolean)
    .join("|");
}

export function wordCount(text: string) {
  return normalizeWhitespace(text)
    .split(/\s+/)
    .filter(Boolean).length;
}

export function charCount(text: string) {
  return normalizeWhitespace(text).length;
}

export function charCountWithoutSpaces(text: string) {
  return normalizeWhitespace(text).replace(/\s+/g, "").length;
}

export function readingTimeMinutes(text: string) {
  return Math.max(1, Math.ceil(wordCount(text) / 220));
}

export function splitIntoParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);
}

export function normalizeTextForSimilarity(text: string) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
}

export function titleSimilarityScore(a: string, b: string) {
  const aTokens = new Set(normalizeTextForSimilarity(a).split(/\s+/).filter(Boolean));
  const bTokens = new Set(normalizeTextForSimilarity(b).split(/\s+/).filter(Boolean));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}
