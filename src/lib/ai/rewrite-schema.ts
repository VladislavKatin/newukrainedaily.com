import { z } from "zod";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value;
}

function normalizeStringArray(value: unknown, splitter: (input: string) => string[]) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return splitter(value)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  return value;
}

function splitBullets(input: string) {
  return input
    .split(/\r?\n+/)
    .map((part) => part.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function splitCommaList(input: string) {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export const rewriteOutputSchema = z.object({
  title: z.preprocess(normalizeString, z.string().min(20).max(70)),
  meta_title: z.preprocess(normalizeString, z.string().min(20).max(70)),
  meta_description: z.preprocess(normalizeString, z.string().min(80).max(170)),
  lede: z.preprocess(normalizeString, z.string().min(80).max(400)),
  body: z.preprocess(normalizeString, z.string().min(1500).max(10000)),
  why_it_matters: z.preprocess(normalizeString, z.string().min(120).max(1000)),
  key_points: z.preprocess(
    (value) => normalizeStringArray(value, splitBullets),
    z.array(z.string().min(10).max(220)).min(3).max(6)
  ),
  tags: z.preprocess(
    (value) => normalizeStringArray(value, splitCommaList),
    z.array(z.string().min(2).max(32)).min(4).max(10)
  ),
  topics: z.preprocess(
    (value) => normalizeStringArray(value, splitCommaList),
    z.array(z.string().min(2).max(32)).min(1).max(6)
  ),
  entities: z.preprocess(
    (value) => normalizeStringArray(value, splitCommaList),
    z.array(z.string().min(2).max(64)).min(1).max(12)
  ),
  primary_topic: z.preprocess(normalizeString, z.string().min(2).max(32)),
  image_prompt: z.preprocess(normalizeString, z.string().min(30).max(500)),
  image_alt: z.preprocess(normalizeString, z.string().min(20).max(140)),
  slug: z.preprocess(normalizeString, z.string().min(5).max(90)),
  location: z.preprocess(normalizeString, z.string().max(120).optional()).optional()
});

export type RewriteOutput = z.infer<typeof rewriteOutputSchema>;

export function countCharactersWithoutSpaces(body: string) {
  return body.replace(/\s+/g, "").trim().length;
}

export function assertRewriteBodyLength(body: string) {
  return countCharactersWithoutSpaces(body) >= 1500;
}
