import { z } from "zod";

function splitRichText(value: string) {
  return value
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitList(value: string) {
  return value
    .split(/\r?\n+/)
    .map((part) => part.replace(/^[-*•\d.)\s]+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function clampText(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trim()}...`;
}

function chunkParagraphs(value: string, maxLength: number) {
  const sentences = splitSentences(value);

  if (sentences.length === 0) {
    return [clampText(value.replace(/\s+/g, " ").trim(), maxLength)].filter(Boolean);
  }

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(clampText(current, maxLength));
    }

    current = sentence.length > maxLength ? clampText(sentence, maxLength) : sentence;
  }

  if (current) {
    chunks.push(clampText(current, maxLength));
  }

  return chunks.filter(Boolean);
}

function normalizeParagraphCollection(
  value: unknown,
  minItems: number,
  maxItems: number,
  maxLength: number
) {
  const baseItems = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? splitRichText(value)
      : [];

  const expanded = baseItems.flatMap((item) => chunkParagraphs(item, maxLength));
  const normalized = expanded.map((item) => clampText(item, maxLength)).filter(Boolean);

  if (normalized.length >= minItems) {
    return normalized.slice(0, maxItems);
  }

  const sourceText = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join(" ")
    : typeof value === "string"
      ? value
      : "";
  const fallback = chunkParagraphs(sourceText, maxLength).slice(0, maxItems);

  return fallback;
}

function normalizeStringArray(value: unknown, splitter: (value: string) => string[]) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return splitter(value);
  }

  return value;
}

function normalizeListCollection(value: unknown, splitter: (value: string) => string[], maxLength: number) {
  const normalized = normalizeStringArray(value, splitter);

  if (!Array.isArray(normalized)) {
    return normalized;
  }

  return normalized
    .filter((item): item is string => typeof item === "string")
    .map((item) => clampText(item.replace(/\s+/g, " ").trim(), maxLength))
    .filter(Boolean);
}

export const rewriteOutputSchema = z.object({
  title: z.string().min(10).max(90),
  dek: z.string().min(10).max(220),
  summary: z.preprocess(
    (value) => normalizeParagraphCollection(value, 2, 4, 700),
    z.array(z.string().min(30).max(700)).min(2).max(4)
  ),
  keyPoints: z.preprocess(
    (value) => normalizeListCollection(value, splitList, 220),
    z.array(z.string().min(10).max(220)).min(3).max(5)
  ),
  whyItMatters: z.preprocess(
    (value) => normalizeParagraphCollection(value, 1, 2, 500),
    z.array(z.string().min(30).max(500)).min(1).max(2)
  ),
  tags: z.preprocess(
    (value) =>
      normalizeListCollection(
        value,
        (input) => input.split(",").map((part) => part.trim()).filter(Boolean),
        32
      ),
    z.array(z.string().min(2).max(32)).min(5).max(10)
  ),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  language: z.literal("en")
});

export type RewriteOutput = z.infer<typeof rewriteOutputSchema>;
