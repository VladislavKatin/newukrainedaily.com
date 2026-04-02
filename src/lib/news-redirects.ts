export const NEWS_REDIRECTS: Record<string, string> = {
  "ukraine-accuses-russia-of-redirecting-drones-toward-baltic-states": "ukraine-warns-of-russian-drone-diversions-to-baltic-states"
};

export function getNewsRedirectSlug(slug: string) {
  return NEWS_REDIRECTS[slug] ?? null;
}
