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
  "related coverage",
  "earlier reporting",
  "latest reporting",
  "recent updates",
  "previous coverage"
];

const TOPIC_ANCHOR_TEMPLATES = ["more on this topic", "topic hub", "latest topic coverage"];

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function overlapScore(current: NewsItemRecord, candidate: NewsItemRecord) {
  const currentTokens = new Set([
    ...current.tags.map(normalize),
    ...current.topics.map(normalize),
    ...current.entities.map(normalize),
    normalize(current.primaryTopic)
  ].filter(Boolean));
  const candidateTokens = new Set([
    ...candidate.tags.map(normalize),
    ...candidate.topics.map(normalize),
    ...candidate.entities.map(normalize),
    normalize(candidate.primaryTopic)
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
  const candidates = published
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => ({ candidate, score: overlapScore(current, candidate) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

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
