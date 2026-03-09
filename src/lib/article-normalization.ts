import { absoluteUrl, siteConfig } from "@/lib/site";

const FORBIDDEN_FILLER_PATTERNS = [
  /as the situation continues to develop[^.!?]*[.!?]/gi,
  /this underscores[^.!?]*[.!?]/gi,
  /this highlights[^.!?]*[.!?]/gi,
  /the ongoing situation demonstrates[^.!?]*[.!?]/gi,
  /the comprehensive response is crucial[^.!?]*[.!?]/gi,
  /the evolving threat landscape[^.!?]*[.!?]/gi,
  /it remains to be seen[^.!?]*[.!?]/gi,
  /this serves as a reminder[^.!?]*[.!?]/gi,
  /in the context of ongoing events[^.!?]*[.!?]/gi,
  /it is worth noting[^.!?]*[.!?]/gi,
  /moreover[^.!?]*[.!?]/gi,
  /in addition[^.!?]*[.!?]/gi
];

const TECHNICAL_PREVIEW_CAPTION_PATTERNS = [
  /^preview:\s*original image from\s+/i,
  /^preview:\s*/i
];

const TECHNICAL_AI_CAPTION_PATTERNS = [
  /^illustration generated with ai \(leonardo\) based on the headline$/i,
  /^generated with ai based on the headline$/i,
  /^ai generated image$/i
];

const MAX_META_DESCRIPTION = 160;

type ImageKind = "preview" | "generated";

export type NormalizeImageBlocksInput = {
  previewImageUrl?: string | null;
  previewImageCaption?: string | null;
  previewImageAlt?: string | null;
  previewImageSourceName?: string | null;
  generatedImageUrl?: string | null;
  generatedImageCaption?: string | null;
  generatedImageAlt?: string | null;
  title: string;
  lead?: string | null;
  sourceName?: string | null;
};

export type SanitizedArticleInput = {
  type: "news" | "blog";
  title: string;
  summary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  body?: string | null;
  whyItMatters?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  previewImageUrl?: string | null;
  previewImageCaption?: string | null;
  previewImageAlt?: string | null;
  generatedImageUrl?: string | null;
  generatedImageCaption?: string | null;
  generatedImageAlt?: string | null;
};

export type SanitizedArticleOutput = {
  title: string;
  lead: string;
  bodyParagraphs: string[];
  body: string;
  excerpt: string;
  metaDescription: string;
  sourceAttribution: string | null;
  previewImageUrl?: string;
  previewImageCaption?: string;
  previewImageAlt?: string;
  generatedImageUrl?: string;
  generatedImageCaption?: string;
  generatedImageAlt?: string;
  primaryImageUrl?: string;
  primaryImageAlt?: string;
};

function normalizeWhitespace(value: string | null | undefined) {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitSentences(value: string) {
  return normalizeWhitespace(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function clampText(value: string, max: number) {
  const normalized = normalizeWhitespace(value).replace(/\s+/g, " ");
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function dedupeParagraphs(paragraphs: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const paragraph of paragraphs) {
    const normalized = paragraph.toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(paragraph);
  }

  return result;
}

function sanitizeCaptionSource(sourceName?: string | null) {
  return normalizeWhitespace(sourceName) || siteConfig.publisherName;
}

function needsSentenceCleanup(sentence: string) {
  return FORBIDDEN_FILLER_PATTERNS.some((pattern) => pattern.test(sentence));
}

function sentenceLooksUseful(sentence: string) {
  const normalized = normalizeWhitespace(sentence);
  if (!normalized) {
    return false;
  }

  return !needsSentenceCleanup(normalized);
}

export function cleanAIFiller(text: string) {
  let result = normalizeWhitespace(text);

  for (const pattern of FORBIDDEN_FILLER_PATTERNS) {
    result = result.replace(pattern, " ");
  }

  const cleanedSentences = splitSentences(result).filter(sentenceLooksUseful);
  if (cleanedSentences.length === 0) {
    return normalizeWhitespace(text);
  }

  return cleanedSentences.join(" ");
}

export function normalizeTitle(title: string, fallbackTitle?: string | null) {
  const normalized = normalizeWhitespace(title || fallbackTitle || "").replace(/[…]+/g, "...");
  if (!normalized) {
    return "Ukraine News Update";
  }

  return clampText(normalized.replace(/\s+/g, " "), 90);
}

export function splitIntoEditorialParagraphs(text: string) {
  const normalized = cleanAIFiller(text);
  const rawParagraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter(Boolean);

  const editorialParagraphs: string[] = [];

  for (const paragraph of rawParagraphs) {
    if (/^#{1,3}\s+/.test(paragraph) || /^[A-Z][A-Za-z\s]+:\s*$/.test(paragraph)) {
      editorialParagraphs.push(paragraph);
      continue;
    }

    const sentences = splitSentences(paragraph);
    if (sentences.length <= 4 && paragraph.length <= 500) {
      editorialParagraphs.push(paragraph);
      continue;
    }

    let bucket: string[] = [];
    for (const sentence of sentences) {
      bucket.push(sentence);
      if (bucket.length >= 2) {
        editorialParagraphs.push(bucket.join(" "));
        bucket = [];
      }
    }

    if (bucket.length > 0) {
      editorialParagraphs.push(bucket.join(" "));
    }
  }

  return dedupeParagraphs(editorialParagraphs);
}

function buildLeadSeed(input: SanitizedArticleInput) {
  const candidates = [
    input.summary,
    input.excerpt,
    input.content,
    input.body,
    input.whyItMatters
  ]
    .map((value) => normalizeWhitespace(value))
    .filter(Boolean);

  return candidates[0] || input.title;
}

export function buildLeadFromFacts(input: SanitizedArticleInput) {
  const seed = cleanAIFiller(buildLeadSeed(input));
  const sentences = splitSentences(seed);
  const leadSentences = sentences.slice(0, 2);
  const fallback = normalizeWhitespace(input.summary || input.excerpt || input.title);
  const lead = normalizeWhitespace(leadSentences.join(" ") || fallback || input.title);

  return clampText(lead, 320);
}

export function buildImageCaption(kind: ImageKind, sourceName?: string | null) {
  const normalizedSource = sanitizeCaptionSource(sourceName);
  if (kind === "preview") {
    return `Photo: ${normalizedSource}`;
  }

  return "AI illustration based on reported details. Not a documentary image.";
}

export function buildImageAlt(kind: ImageKind, input: { title: string; lead?: string | null; sourceName?: string | null }) {
  const factualSeed = normalizeWhitespace(input.lead || input.title);
  const title = normalizeTitle(input.title);

  if (kind === "preview") {
    return clampText(factualSeed || `${title} source photo`, 140);
  }

  return clampText(`AI illustration of ${factualSeed || title}`.replace(/^AI illustration of AI illustration/i, "AI illustration of"), 140);
}

export function normalizeImageBlocks(input: NormalizeImageBlocksInput) {
  const previewUrl = normalizeWhitespace(input.previewImageUrl || "") || undefined;
  const generatedUrl = normalizeWhitespace(input.generatedImageUrl || "") || undefined;
  const dedupedGeneratedUrl =
    generatedUrl && previewUrl && generatedUrl === previewUrl ? undefined : generatedUrl;

  const previewCaption = previewUrl
    ? buildImageCaption("preview", input.previewImageSourceName || input.sourceName)
    : undefined;
  const generatedCaption = dedupedGeneratedUrl ? buildImageCaption("generated", input.sourceName) : undefined;

  return {
    previewImageUrl: previewUrl,
    previewImageCaption: previewCaption,
    previewImageAlt: previewUrl
      ? buildImageAlt("preview", {
          title: input.title,
          lead: input.lead,
          sourceName: input.previewImageSourceName || input.sourceName
        })
      : undefined,
    generatedImageUrl: dedupedGeneratedUrl,
    generatedImageCaption: generatedCaption,
    generatedImageAlt: dedupedGeneratedUrl
      ? buildImageAlt("generated", {
          title: input.title,
          lead: input.lead,
          sourceName: input.sourceName
        })
      : undefined
  };
}

export function buildMetaDescription(input: { lead: string; title: string }) {
  const seed = normalizeWhitespace(input.lead || input.title);
  return clampText(seed, MAX_META_DESCRIPTION);
}

function buildBodyParagraphs(input: SanitizedArticleInput, lead: string) {
  const sourceText = normalizeWhitespace(input.content || input.body || "");
  const sanitizedParagraphs = splitIntoEditorialParagraphs(sourceText);

  if (sanitizedParagraphs.length === 0) {
    return [lead];
  }

  const deduped = sanitizedParagraphs.filter((paragraph, index) => {
    if (index === 0) {
      return normalizeWhitespace(paragraph).toLowerCase() !== lead.toLowerCase();
    }

    return true;
  });

  return dedupeParagraphs(deduped);
}

export function sanitizeArticleForPublishing(input: SanitizedArticleInput): SanitizedArticleOutput {
  const title = normalizeTitle(input.title);
  const lead = buildLeadFromFacts(input);
  const bodyParagraphs = buildBodyParagraphs(input, lead);
  const images = normalizeImageBlocks({
    previewImageUrl: input.previewImageUrl,
    previewImageCaption: input.previewImageCaption,
    previewImageAlt: input.previewImageAlt,
    previewImageSourceName: input.sourceName,
    generatedImageUrl: input.generatedImageUrl,
    generatedImageCaption: input.generatedImageCaption,
    generatedImageAlt: input.generatedImageAlt,
    title,
    lead,
    sourceName: input.sourceName
  });
  const sourceAttribution = input.sourceName ? `Source: ${sanitizeCaptionSource(input.sourceName)}` : null;
  const body = bodyParagraphs.join("\n\n");
  const excerpt = lead;
  const metaDescription = buildMetaDescription({ lead, title });
  const primaryImageUrl = images.previewImageUrl || images.generatedImageUrl || undefined;
  const primaryImageAlt = images.previewImageAlt || images.generatedImageAlt || title;

  return {
    title,
    lead,
    bodyParagraphs,
    body,
    excerpt,
    metaDescription,
    sourceAttribution,
    previewImageUrl: images.previewImageUrl,
    previewImageCaption: images.previewImageCaption,
    previewImageAlt: images.previewImageAlt,
    generatedImageUrl: images.generatedImageUrl,
    generatedImageCaption: images.generatedImageCaption,
    generatedImageAlt: images.generatedImageAlt,
    primaryImageUrl,
    primaryImageAlt
  };
}

export function buildCanonicalImageUrl(url: string | null | undefined) {
  if (!url) {
    return absoluteUrl(siteConfig.defaultOgImage);
  }

  return url.startsWith("http://") || url.startsWith("https://") ? url : absoluteUrl(url);
}

export function normalizeVisibleCaption(caption: string | null | undefined, kind: ImageKind, sourceName?: string | null) {
  const normalized = normalizeWhitespace(caption);

  if (kind === "preview") {
    if (!normalized || TECHNICAL_PREVIEW_CAPTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
      return buildImageCaption("preview", sourceName);
    }

    return normalized;
  }

  if (!normalized || TECHNICAL_AI_CAPTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return buildImageCaption("generated", sourceName);
  }

  return normalized;
}
