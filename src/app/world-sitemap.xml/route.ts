import { absoluteUrl } from "@/lib/site";
import { listWorldDigestDatesForSitemap } from "@/lib/world-repository";

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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

export async function GET() {
  try {
    const dates = await listWorldDigestDatesForSitemap(365);
    const items = [
      `<url><loc>${escapeXml(absoluteUrl("/world"))}</loc></url>`,
      ...dates.map((date) => `<url><loc>${escapeXml(absoluteUrl(`/world/${date}`))}</loc></url>`)
    ].join("\n");

    return new Response(buildXml(items), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("[world-sitemap] failed", error);
    return new Response(buildXml(`<url><loc>${escapeXml(absoluteUrl("/world"))}</loc></url>`), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  }
}
