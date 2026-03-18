import "server-only";
import type { ContentEntry } from "@/lib/content-types";

function normalize(value: string | null | undefined) {
  return (value || "").replace(/[^\p{L}\p{N}\s-]+/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

function tokenize(value: string | null | undefined) {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function overlapScore(current: ContentEntry, candidate: ContentEntry) {
  let score = 0;
  const currentTags = new Set(current.tags.map((tag) => normalize(tag)).filter(Boolean));
  const candidateTags = new Set(candidate.tags.map((tag) => normalize(tag)).filter(Boolean));

  for (const tag of currentTags) {
    if (candidateTags.has(tag)) {
      score += 4;
    }
  }

  const currentTokens = new Set([
    ...tokenize(current.title),
    ...tokenize(current.description),
    ...tokenize(current.excerpt)
  ]);
  const candidateTokens = new Set([
    ...tokenize(candidate.title),
    ...tokenize(candidate.description),
    ...tokenize(candidate.excerpt)
  ]);

  for (const token of currentTokens) {
    if (candidateTokens.has(token)) {
      score += 1;
    }
  }

  const ageDeltaHours =
    Math.abs(new Date(current.publishedAt).getTime() - new Date(candidate.publishedAt).getTime()) /
    (1000 * 60 * 60);

  if (ageDeltaHours <= 72) {
    score += 2;
  } else if (ageDeltaHours <= 168) {
    score += 1;
  }

  return score;
}

export function buildRelatedEntries(current: ContentEntry, entries: ContentEntry[], limit = 3) {
  const candidates = entries
    .filter((candidate) => candidate.type === current.type && candidate.slug !== current.slug)
    .map((candidate) => ({ candidate, score: overlapScore(current, candidate) }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.candidate.publishedAt).getTime() - new Date(left.candidate.publishedAt).getTime();
    });

  const primary = candidates.filter(({ score }) => score > 0).map(({ candidate }) => candidate);
  const fallback = candidates.filter(({ score }) => score <= 0).map(({ candidate }) => candidate);

  return [...primary, ...fallback].slice(0, limit);
}