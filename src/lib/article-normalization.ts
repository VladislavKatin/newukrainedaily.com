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
  /in addition[^.!?]*[.!?]/gi,
  /according to him[^.!?]*[.!?]/gi,
  /according to her[^.!?]*[.!?]/gi,
  /according to them[^.!?]*[.!?]/gi,
  /according to officials[^.!?]*[.!?]/gi,
  /this development highlights[^.!?]*[.!?]/gi,
  /this latest development highlights[^.!?]*[.!?]/gi,
  /the latest development underscores[^.!?]*[.!?]/gi,
  /in today'?s rapidly changing world[^.!?]*[.!?]/gi
];

const GENERIC_LEAD_PATTERNS = [
  /^ukraine(?:'s)? [a-z\s]+ require/i,
  /^this article /i,
  /^this report /i,
  /^this blog /i,
  /^in a significant move/i,
  /^the latest development/i,
  /^recent events/i,
  /^the situation in ukraine/i
];

const TECHNICAL_PREVIEW_CAPTION_PATTERNS = [/^preview:\s*original image from\s+/i, /^preview:\s*/i];
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

function normalizeMultilineWhitespace(value: string | null | undefined) {
  return normalizeWhitespace(value)
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
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

function splitContentBlocks(value: string) {
  const normalized = normalizeMultilineWhitespace(value);
  const rawBlocks = normalized
    .split(/\n{2,}|(?=^#{1,3}\s+)/m)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks: string[] = [];

  for (const block of rawBlocks) {
    const headingMatch = block.match(/^(#{1,3}\s+[^\n]+)\n+([\s\S]+)$/);

    if (headingMatch) {
      blocks.push(headingMatch[1].trim());
      if (headingMatch[2].trim()) {
        blocks.push(headingMatch[2].trim());
      }
      continue;
    }

    blocks.push(block);
  }

  return blocks;
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

function looksGenericLead(value: string) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return true;
  }

  return GENERIC_LEAD_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function cleanAIFiller(text: string) {
  const blocks = splitContentBlocks(text);

  const cleanedBlocks = blocks
    .map((block) => {
      if (/^#{1,3}\s+/.test(block)) {
        return block;
      }

      let result = block;
      for (const pattern of FORBIDDEN_FILLER_PATTERNS) {
        result = result.replace(pattern, " ");
      }

      const cleanedSentences = splitSentences(result).filter(sentenceLooksUseful);
      if (cleanedSentences.length === 0) {
        return normalizeWhitespace(block);
      }

      return cleanedSentences.join(" ");
    })
    .filter(Boolean);

  return cleanedBlocks.join("\n\n");
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
  const rawParagraphs = splitContentBlocks(normalized)
    .map((paragraph) => normalizeMultilineWhitespace(paragraph))
    .filter(Boolean);

  const editorialParagraphs: string[] = [];

  for (const paragraph of rawParagraphs) {
    if (/^#{1,3}\s+/.test(paragraph) || /^[A-Z][A-Za-z\s]+:\s*$/.test(paragraph)) {
      editorialParagraphs.push(paragraph);
      continue;
    }

    const sentences = splitSentences(paragraph);
    if (sentences.length <= 3 && paragraph.length <= 420) {
      editorialParagraphs.push(paragraph);
      continue;
    }

    let bucket: string[] = [];
    for (const sentence of sentences) {
      bucket.push(sentence);
      const bucketText = bucket.join(" ");
      if (bucket.length >= 2 && bucketText.length >= 180) {
        editorialParagraphs.push(bucketText);
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
  const contentParagraph = splitIntoEditorialParagraphs(input.content || input.body || "")
    .find((paragraph) => !/^#{1,3}\s+/.test(paragraph));

  const preferredSummary = !looksGenericLead(input.summary || "") ? input.summary : undefined;
  const preferredExcerpt = !looksGenericLead(input.excerpt || "") ? input.excerpt : undefined;

  const candidates = [preferredSummary, preferredExcerpt, contentParagraph, input.whyItMatters, input.title]
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

  return "Illustration for this report. Created by the editorial desk using AI.";
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
  const dedupedGeneratedUrl = generatedUrl && previewUrl && generatedUrl === previewUrl ? undefined : generatedUrl;

  return {
    previewImageUrl: previewUrl,
    previewImageCaption: previewUrl
      ? buildImageCaption("preview", input.previewImageSourceName || input.sourceName)
      : undefined,
    previewImageAlt: previewUrl
      ? buildImageAlt("preview", {
          title: input.title,
          lead: input.lead,
          sourceName: input.previewImageSourceName || input.sourceName
        })
      : undefined,
    generatedImageUrl: dedupedGeneratedUrl,
    generatedImageCaption: dedupedGeneratedUrl ? buildImageCaption("generated", input.sourceName) : undefined,
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

function ensureEditorialSections(paragraphs: string[], whyItMatters?: string | null) {
  if (paragraphs.some((paragraph) => /^##\s+/.test(paragraph))) {
    return paragraphs;
  }

  const plainParagraphs = paragraphs.filter((paragraph) => !/^#{1,3}\s+/.test(paragraph));
  if (plainParagraphs.length === 0) {
    return paragraphs;
  }

  const first = plainParagraphs.slice(0, 2);
  const second = plainParagraphs.slice(2, 4);
  const remainder = plainParagraphs.slice(4);
  const whyBlock = normalizeWhitespace(whyItMatters) || remainder.shift() || "";
  const sections = [
    { heading: "## What Happened", items: first },
    { heading: "## Key Details", items: second.length > 0 ? second : plainParagraphs.slice(0, 1) },
    { heading: "## Why It Matters", items: whyBlock ? [whyBlock] : [] },
    { heading: "## Background", items: remainder }
  ].filter((section) => section.items.length > 0);

  return sections.flatMap((section) => [section.heading, ...section.items]);
}

function buildBodyParagraphs(input: SanitizedArticleInput, lead: string) {
  const sourceText = normalizeMultilineWhitespace(input.content || input.body || "");
  const sanitizedParagraphs = splitIntoEditorialParagraphs(sourceText);

  if (sanitizedParagraphs.length === 0) {
    return [lead];
  }

  const deduped = sanitizedParagraphs.filter((paragraph, index) => {
    if (/^#\s+/.test(paragraph)) {
      return false;
    }

    const normalizedParagraph = normalizeWhitespace(paragraph).toLowerCase();
    if (index === 0 && normalizedParagraph === lead.toLowerCase()) {
      return false;
    }

    return normalizedParagraph !== normalizeWhitespace(input.title).toLowerCase();
  });

  const structured = ensureEditorialSections(deduped, input.whyItMatters);
  if (!/^##\s+/.test(structured[0] || "") && structured.slice(1).some((paragraph) => /^##\s+/.test(paragraph))) {
    return dedupeParagraphs(structured.slice(1));
  }

  return dedupeParagraphs(structured);
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


