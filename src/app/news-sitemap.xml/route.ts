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

function buildXml(items: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;
}

function safeDate(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
}

function safeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

export async function GET() {
  try {
    const { getEntriesByType } = await import("@/lib/content");
    const newsEntries = await getEntriesByType("news");
    const now = Date.now();
    const recent = newsEntries
      .filter((entry) => now - safeDate(entry.publishedAt).getTime() <= NEWS_WINDOW_MS)
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
    <news:publication_date>${safeDate(entry.publishedAt).toISOString()}</news:publication_date>
    <news:title>${escapeXml(safeText(entry.title, "Ukraine news update"))}</news:title>
  </news:news>
</url>`;
      })
      .join("\n");

    return new Response(buildXml(items), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    console.error("[news-sitemap] failed to build feed", error);
    return new Response(buildXml(""), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  }
}
