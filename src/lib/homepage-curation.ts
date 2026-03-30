import type { ContentEntry } from "@/lib/content-types";

const SOURCE_PRIORITY: Record<string, number> = {
  "ukrinform en": 12,
  "ukrinform ua": 12,
  "ukrainska pravda en": 11,
  "ukrainska pravda en news": 11,
  "ukrainska pravda ua": 11,
  "interfax ukraine": 10,
  "rbc ukraine": 9,
  "radio svoboda": 8,
  "tsn ukraine": 7,
  "nv ukraine": 7,
  obozrevatel: 5,
  "european pravda ua": 5
};

const PREFERRED_TOPICS = new Set([
  "ukraine",
  "security",
  "diplomacy",
  "humanitarian",
  "energy",
  "economy",
  "russia",
  "us",
  "eu",
  "nato"
]);

const WEAK_MARKERS = [
  "historian",
  "artifact",
  "artifacts",
  "documentary",
  "community in france",
  "community in poland",
  "conference set for may",
  "weather forecast",
  "mild temperatures",
  "artist",
  "book",
  "ceremony",
  "festival"
];

const COMBAT_SUMMARY_PATTERN = new RegExp(String.raw`\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|\d,?\d*)\b[^\n]*\b(combat|clashes|engagements|front line|frontline)\b`, "i");
const LOSSES_SUMMARY_PATTERN = new RegExp(String.raw`\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|\d,?\d*)\b[^\n]*\b(troops|casualties|losses|personnel)\b`, "i");
const AIR_DEFENSE_SUMMARY_PATTERN = new RegExp(String.raw`\bair defense\b|\bdowns?\b[^\n]*\bdrones?\b|\bintercepts?\b[^\n]*\bdrones?\b`, "i");
const STRONG_NEWS_PATTERN = new RegExp(String.raw`\bdrone\b|\bmissile\b|\bstrike\b|\battack\b|\bcombat\b|\bfront(line)?\b|\bpower outage\b|\benergy\b|\bdefense\b|\bdefence\b|\bsanctions\b|\btalks\b|\balert\b|\bminister\b|\bambassador\b|\bnato\b|\beu\b`, "i");

function normalizeToken(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function uniqueBySlug(entries: ContentEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.slug)) {
      return false;
    }

    seen.add(entry.slug);
    return true;
  });
}

function buildSignalText(entry: ContentEntry) {
  return normalizeToken([
    entry.title,
    entry.description,
    entry.excerpt,
    entry.lead || "",
    entry.author,
    ...(entry.tags || []),
    entry.primaryTopic || "",
    entry.storyFormat || ""
  ].join(" "));
}

function angleSignature(entry: ContentEntry) {
  const text = buildSignalText(entry);

  if (COMBAT_SUMMARY_PATTERN.test(text)) {
    return "combat-summary";
  }

  if (LOSSES_SUMMARY_PATTERN.test(text)) {
    return "losses-summary";
  }

  if (AIR_DEFENSE_SUMMARY_PATTERN.test(text)) {
    return "air-defense-summary";
  }

  return entry.slug;
}

function getRecencyBoost(entry: ContentEntry) {
  const publishedAt = new Date(entry.publishedAt).getTime();
  if (Number.isNaN(publishedAt)) {
    return 0;
  }

  const ageHours = Math.max(0, (Date.now() - publishedAt) / (1000 * 60 * 60));
  if (ageHours <= 12) {
    return 18;
  }
  if (ageHours <= 24) {
    return 12;
  }
  if (ageHours <= 48) {
    return 7;
  }
  if (ageHours <= 96) {
    return 3;
  }
  return 0;
}

function scoreEntry(entry: ContentEntry) {
  const text = buildSignalText(entry);
  const sourcePriority = SOURCE_PRIORITY[normalizeToken(entry.author)] ?? 0;
  const topicBonus = (entry.tags || []).reduce(
    (total, tag) => total + (PREFERRED_TOPICS.has(normalizeToken(tag)) ? 2 : 0),
    0
  );

  let score = sourcePriority * 10 + topicBonus + getRecencyBoost(entry);

  if (PREFERRED_TOPICS.has(normalizeToken(entry.primaryTopic))) {
    score += 16;
  }

  if (entry.storyFormat === "Breaking" || entry.storyFormat === "Update") {
    score += 12;
  }

  if (STRONG_NEWS_PATTERN.test(text)) {
    score += 10;
  }

  if (WEAK_MARKERS.some((marker) => text.includes(marker))) {
    score -= 24;
  }

  return score;
}

function pickBreaking(entries: ContentEntry[]) {
  return entries.filter((entry) => entry.storyFormat === "Breaking" || entry.storyFormat === "Update");
}

function uniqueByAngle(entries: ContentEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const signature = angleSignature(entry);
    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function rankEntries(entries: ContentEntry[]) {
  return [...entries].sort((left, right) => {
    const scoreDiff = scoreEntry(right) - scoreEntry(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}

export function curateHomepageNews(entries: ContentEntry[]) {
  const uniqueEntries = uniqueBySlug(entries);
  const ranked = uniqueByAngle(rankEntries(uniqueEntries));
  const breakingEntries = uniqueByAngle(rankEntries(pickBreaking(ranked)));
  const leadStory = breakingEntries[0] ?? ranked[0];
  const remaining = ranked.filter((entry) => entry.slug !== leadStory?.slug);
  const developingNow = uniqueByAngle([
    ...breakingEntries.filter((entry) => entry.slug !== leadStory?.slug),
    ...remaining
  ]).slice(0, 4);
  const topStories = uniqueByAngle(remaining).slice(0, 4);
  const latestRail = uniqueByAngle(uniqueEntries)
    .filter((entry) => entry.slug !== leadStory?.slug && !topStories.some((top) => top.slug === entry.slug))
    .slice(0, 4);

  return {
    leadStory,
    developingNow,
    topStories,
    latestRail
  };
}

export function curateNewsArchivePage(
  entries: ContentEntry[],
  options: { limit: number; offset: number }
) {
  const uniqueEntries = uniqueBySlug(entries);
  const ranked = uniqueByAngle(rankEntries(uniqueEntries));
  const pageEntries = ranked.slice(options.offset, options.offset + options.limit);

  return {
    entries: pageEntries,
    total: ranked.length
  };
}
