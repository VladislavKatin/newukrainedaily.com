import "server-only";
import type { NewsItemRecord } from "@/lib/postgres-repository";
import { topicSlugFromLabel } from "@/lib/topic-taxonomy";

export type InternalLink = {
  type: "topic" | "article";
  href: string;
  title: string;
  anchor: string;
};

const ARTICLE_ANCHOR_TEMPLATES = [
  "read the related report",
  "see the earlier report",
  "see the latest update",
  "read more coverage",
  "see the previous report"
];

const TOPIC_ANCHOR_TEMPLATES = ["more on this topic", "browse the topic page", "latest topic coverage"];

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function overlapScore(current: NewsItemRecord, candidate: NewsItemRecord) {
  const currentTokens = new Set([
    ...current.tags.map(normalize),
    ...current.topics.map(normalize),
    ...current.entities.map(normalize),
    normalize(current.primaryTopic),
    ...normalize(current.title).split(" ").filter((token) => token.length >= 4)
  ].filter(Boolean));
  const candidateTokens = new Set([
    ...candidate.tags.map(normalize),
    ...candidate.topics.map(normalize),
    ...candidate.entities.map(normalize),
    normalize(candidate.primaryTopic),
    ...normalize(candidate.title).split(" ").filter((token) => token.length >= 4)
  ].filter(Boolean));

  let score = 0;
  for (const token of currentTokens) {
    if (candidateTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

function pickAnchor(templates: string[], index: number, fallback: string) {
  return templates[index] || fallback;
}

export function buildInternalLinks(current: NewsItemRecord, published: NewsItemRecord[]) {
  const scoredCandidates = published
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => ({ candidate, score: overlapScore(current, candidate) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return new Date(b.candidate.publishedAt || b.candidate.createdAt).getTime() - new Date(a.candidate.publishedAt || a.candidate.createdAt).getTime();
    });

  const primaryCandidates = scoredCandidates.filter(({ score }) => score > 0).slice(0, 5);
  const fallbackCandidates = scoredCandidates
    .filter(({ candidate }) => !primaryCandidates.some((item) => item.candidate.id === candidate.id))
    .slice(0, Math.max(0, 5 - primaryCandidates.length));
  const candidates = [...primaryCandidates, ...fallbackCandidates].slice(0, 5);

  const topicLabel = current.primaryTopic || current.topics[0] || current.tags[0] || "World";
  const topicSlug = topicSlugFromLabel(topicLabel);

  const links: InternalLink[] = [
    {
      type: "topic",
      href: `/topic/${topicSlug}`,
      title: topicLabel,
      anchor: pickAnchor(TOPIC_ANCHOR_TEMPLATES, 0, topicLabel)
    }
  ];

  candidates.forEach(({ candidate }, index) => {
    links.push({
      type: "article",
      href: `/news/${candidate.slug}`,
      title: candidate.title,
      anchor: pickAnchor(ARTICLE_ANCHOR_TEMPLATES, index, candidate.title)
    });
  });

  return {
    links: links.slice(0, 7),
    relatedIds: candidates.map(({ candidate }) => candidate.id).slice(0, 5)
  };
}