import type { ContentEntry } from "@/lib/content-types";

const CURATED_LEAD_SLUGS = [
  "eu-countries-discuss-new-rules-for-ukrainian-refugees-protection",
  "delegations-from-100-countries-to-attend-ukraine-recovery-conference",
  "zelensky-reports-increased-russian-missile-strikes-on-ukraine",
  "ukraine-seeks-support-from-middle-east-allies-in-defense-and-recons"
];

const CURATED_TOP_STORY_SLUGS = [
  "delegations-from-100-countries-to-attend-ukraine-recovery-conference",
  "mild-weather-ahead-for-ukraine-with-possible-rain-and-snow",
  "zelensky-reports-increased-russian-missile-strikes-on-ukraine",
  "eu-countries-discuss-new-rules-for-ukrainian-refugees-protection"
];

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

function pickBySlug(entries: ContentEntry[], slugs: string[]) {
  const map = new Map(entries.map((entry) => [entry.slug, entry]));
  return slugs.map((slug) => map.get(slug)).filter((entry): entry is ContentEntry => Boolean(entry));
}

function pickBreaking(entries: ContentEntry[]) {
  return entries.filter((entry) => entry.storyFormat === "Breaking" || entry.storyFormat === "Update");
}

export function curateHomepageNews(entries: ContentEntry[]) {
  const uniqueEntries = uniqueBySlug(entries);
  const curatedLead = pickBySlug(uniqueEntries, CURATED_LEAD_SLUGS)[0];
  const breakingEntries = pickBreaking(uniqueEntries);
  const leadStory = curatedLead ?? breakingEntries[0] ?? uniqueEntries[0];

  const remaining = uniqueEntries.filter((entry) => entry.slug !== leadStory?.slug);
  const curatedTopStories = pickBySlug(remaining, CURATED_TOP_STORY_SLUGS);
  const developingNow = uniqueBySlug([...breakingEntries.filter((entry) => entry.slug !== leadStory?.slug), ...remaining]).slice(0, 4);
  const topStories = uniqueBySlug([...curatedTopStories, ...remaining]).slice(0, 4);
  const latestRail = uniqueBySlug(remaining.filter((entry) => !topStories.some((top) => top.slug === entry.slug))).slice(0, 4);

  return {
    leadStory,
    developingNow,
    topStories,
    latestRail
  };
}