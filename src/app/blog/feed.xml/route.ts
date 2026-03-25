import { absoluteUrl, siteConfig } from "@/lib/site";

function wrapCdata(value: string) {
  return `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

function buildXml(itemsXml: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name} Blog Feed</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>Latest published blog posts from ${siteConfig.name}.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;
}

function safeText(value: string | null | undefined, fallback = "") {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function safeUtcDate(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toUTCString() : new Date().toUTCString();
}

export async function GET() {
  try {
    const { getEntriesByType } = await import("@/lib/content");
    const entries = await getEntriesByType("blog");
    const itemsXml = entries
      .slice(0, 25)
      .map(
        (entry) => `<item>
      <title>${wrapCdata(safeText(entry.title, "Ukraine analysis"))}</title>
      <link>${absoluteUrl(`/blog/${entry.slug}`)}</link>
      <guid>${absoluteUrl(`/blog/${entry.slug}`)}</guid>
      <pubDate>${safeUtcDate(entry.publishedAt)}</pubDate>
      <description>${wrapCdata(safeText(entry.description, safeText(entry.title, "Ukraine analysis")))}</description>
    </item>`
      )
      .join("\n");

    return new Response(buildXml(itemsXml), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    console.error("[blog-feed] failed to build blog feed", error);
    return new Response(buildXml(""), {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  }
}
