import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
export const dynamic = "force-static";

const staticRoutes = [
  "/",
  "/news",
  "/world",
  "/blog",
  "/donate",
  "/about",
  "/privacy-policy",
  "/terms",
  "/accessibility",
  "/editorial-policy",
  "/contact",
  "/newsroom",
  "/corrections"
];

// Only the pages that change with every new article get a lastmod (the newest
// article's date). A build-time "now" on every page tells Google that all pages
// changed every hour, so it stops trusting lastmod.
function buildStaticEntries(latestContentDate?: Date): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    ...(latestContentDate && ["/", "/news", "/world", "/blog"].includes(route)
      ? { lastModified: latestContentDate }
      : {}),
    changeFrequency: (route === "/" || route === "/news" ? "hourly" : route === "/world" || route === "/blog" ? "daily" : "monthly") as ChangeFrequency,
    priority: route === "/" ? 1 : route === "/news" ? 0.9 : 0.6
  }));
}

function hasDynamicSitemapData() {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);
}

function safeDate(value: string | null | undefined) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!hasDynamicSitemapData()) {
    return buildStaticEntries();
  }

  try {
    const [{ listBlog, listIndexableTopics, listNews }, { topicSlugFromLabel }, { listWorldDigestDatesForSitemap }] = await Promise.all([
      import("@/lib/postgres-repository"),
      import("@/lib/topic-taxonomy"),
      import("@/lib/world-repository")
    ]);

    const [newsEntries, blogEntries, topics, worldDates] = await Promise.all([
      listNews(10000, "published"),
      listBlog(5000, "published"),
      listIndexableTopics(5000),
      listWorldDigestDatesForSitemap(365)
    ]);

    let latestContentDate: Date | undefined;

    for (const entry of newsEntries) {
      const date = safeDate(entry.publishedAt || entry.createdAt);

      if (!latestContentDate || date > latestContentDate) {
        latestContentDate = date;
      }
    }
    const staticEntries = buildStaticEntries(latestContentDate);

    const newsSitemapEntries = newsEntries.map((entry) => ({
      url: absoluteUrl(`/news/${entry.slug}`),
      lastModified: safeDate(entry.updatedAt || entry.publishedAt || entry.createdAt),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.8
    }));

    const blogSitemapEntries = blogEntries.map((entry) => ({
      url: absoluteUrl(`/blog/${entry.slug}`),
      lastModified: safeDate(entry.updatedAt || entry.publishedAt || entry.createdAt),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.8
    }));

    const topicEntries = topics.map((topic) => ({
      url: absoluteUrl(`/topic/${topicSlugFromLabel(topic.tag)}`),
      lastModified: safeDate(topic.updatedAt),
      changeFrequency: "daily" as ChangeFrequency,
      priority: 0.75
    }));

    const worldEntries = worldDates.map((date) => ({
      url: absoluteUrl(`/world/${date}`),
      lastModified: safeDate(`${date}T00:00:00.000Z`),
      changeFrequency: "daily" as ChangeFrequency,
      priority: 0.72
    }));

    return [...staticEntries, ...newsSitemapEntries, ...blogSitemapEntries, ...topicEntries, ...worldEntries];
  } catch (error) {
    console.error("[sitemap] failed to build dynamic sitemap", error);
    // Never publish a sitemap without the 2,500+ articles: fail the build instead.
    throw error;
  }
}
