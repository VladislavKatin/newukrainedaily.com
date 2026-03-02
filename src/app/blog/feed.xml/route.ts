import { getEntriesByType } from "@/lib/content";
import { absoluteUrl, siteConfig } from "@/lib/site";

export async function GET() {
  const entries = await getEntriesByType("blog");
  const itemsXml = entries
    .slice(0, 25)
    .map(
      (entry) => `<item>
      <title><![CDATA[${entry.title}]]></title>
      <link>${absoluteUrl(`/blog/${entry.slug}`)}</link>
      <guid>${absoluteUrl(`/blog/${entry.slug}`)}</guid>
      <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${entry.description}]]></description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${siteConfig.name} Blog Feed</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>Latest published blog posts from ${siteConfig.name}.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
