import { getEntriesByType } from "@/lib/content";
import { absoluteUrl, siteConfig } from "@/lib/site";

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const newsEntries = await getEntriesByType("news");
  const now = Date.now();
  const recent = newsEntries
    .filter((entry) => now - new Date(entry.publishedAt).getTime() <= NEWS_WINDOW_MS)
    .slice(0, 1000);

  const items = recent
    .map((entry) => {
      const url = absoluteUrl(`/news/${entry.slug}`);
      return `<url>
  <loc>${escapeXml(url)}</loc>
  <news:news>
    <news:publication>
      <news:name>${escapeXml(siteConfig.name)}</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>${new Date(entry.publishedAt).toISOString()}</news:publication_date>
    <news:title>${escapeXml(entry.title)}</news:title>
  </news:news>
</url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"
    }
  });
}
