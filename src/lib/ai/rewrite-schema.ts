import { z } from "zod";

function splitRichText(value: string) {
  return value
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitList(value: string) {
  return value
    .split(/\r?\n+/)
    .map((part) => part.replace(/^[-*•\d.)\s]+/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
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

export const rewriteOutputSchema = z.object({
  title: z.string().min(10).max(90),
  dek: z.string().min(10).max(220),
  summary: z.preprocess(
    (value) => normalizeStringArray(value, splitRichText),
    z.array(z.string().min(30).max(700)).min(2).max(4)
  ),
  keyPoints: z.preprocess(
    (value) => normalizeStringArray(value, splitList),
    z.array(z.string().min(10).max(220)).min(3).max(5)
  ),
  whyItMatters: z.preprocess(
    (value) => normalizeStringArray(value, splitRichText),
    z.array(z.string().min(30).max(500)).min(1).max(2)
  ),
  tags: z.preprocess(
    (value) => normalizeStringArray(value, (input) => input.split(",").map((part) => part.trim()).filter(Boolean)),
    z.array(z.string().min(2).max(32)).min(5).max(10)
  ),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  language: z.literal("en")
});

export type RewriteOutput = z.infer<typeof rewriteOutputSchema>;
