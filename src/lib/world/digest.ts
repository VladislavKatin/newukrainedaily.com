import "server-only";
import { worldDigestDateFromDate } from "@/lib/world/date";
import { fetchFreshWorldFeedCandidates } from "@/lib/world/feeds";
import { replaceWorldDigestForDate, type CreateWorldDigestItemInput } from "@/lib/world-repository";
import { getWorldSummaryProvider } from "@/lib/world/summary-provider";

export async function generateWorldDigestForDate(digestDate = worldDigestDateFromDate()) {
  const summaryProvider = getWorldSummaryProvider();
  const candidates = await fetchFreshWorldFeedCandidates({ digestDate });
  const selected = candidates.slice(0, 10);

  const items: CreateWorldDigestItemInput[] = [];
  for (const [index, candidate] of selected.entries()) {
    const summary = await summaryProvider.summarize({
      title: candidate.title,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      contentSnippet: candidate.contentSnippet
    });

    items.push({
      position: index + 1,
      title: candidate.title,
      summary,
      imageUrl: candidate.imageUrl,
      imageAlt: candidate.imageAlt,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      publishedAt: candidate.publishedAt
    });
  }

  const saved = await replaceWorldDigestForDate(digestDate, items);
  return {
    digestDate,
    candidates: candidates.length,
    savedItems: saved.length
  };
}
