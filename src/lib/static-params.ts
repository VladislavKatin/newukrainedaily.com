import "server-only";
import { getAllTags, getEntriesByTagPage, getEntriesByTypePage, type EntryType } from "@/lib/content";
import { topicSlugFromLabel } from "@/lib/topic-taxonomy";

export const LISTING_PAGE_SIZE = 12;

function pageNumbers(total: number) {
  const totalPages = Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE));
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => String(index + 2));
}

export async function listingPageParams(type: EntryType) {
  const { total } = await getEntriesByTypePage(type, { limit: 1, offset: 0, mode: "latest" });
  const pages = pageNumbers(total).map((page) => ({ page }));
  // Static export needs at least one entry for a dynamic segment.
  return pages.length > 0 ? pages : [{ page: "2" }];
}

export async function topicSlugsWithTotals() {
  const tags = await getAllTags();
  const seen = new Set<string>();
  const results: Array<{ tag: string; total: number }> = [];

  for (const label of tags) {
    const tag = topicSlugFromLabel(label);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    const { total } = await getEntriesByTagPage(tag, { limit: 2, offset: 0 });
    if (total >= 2) {
      results.push({ tag, total });
    }
  }

  return results;
}

export async function topicParams() {
  const topics = await topicSlugsWithTotals();
  return topics.length > 0 ? topics.map(({ tag }) => ({ tag })) : [{ tag: "ukraine" }];
}

export async function topicPageParams() {
  const topics = await topicSlugsWithTotals();
  const params = topics.flatMap(({ tag, total }) => pageNumbers(total).map((page) => ({ tag, page })));
  return params.length > 0 ? params : [{ tag: "ukraine", page: "2" }];
}
