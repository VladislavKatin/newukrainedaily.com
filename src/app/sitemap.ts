import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
export const revalidate = 3600;

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

function buildStaticEntries(): MetadataRoute.Sitemap {
  return staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: (route === "/" ? "daily" : "weekly") as ChangeFrequency,
    priority: route === "/" ? 1 : 0.7
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
  const staticEntries = buildStaticEntries();

  if (!hasDynamicSitemapData()) {
    return staticEntries;
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

    const newsSitemapEntries = newsEntries.map((entry) => ({
      url: absoluteUrl(`/news/${entry.slug}`),
      lastModified: safeDate(entry.updatedAt || entry.publishedAt || entry.createdAt),
      changeFrequency: "hourly" as ChangeFrequency,
      priority: 0.9
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
    return staticEntries;
  }
}
