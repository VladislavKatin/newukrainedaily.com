import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
export const revalidate = 3600;

const staticRoutes = [
  "/",
  "/news",
  "/blog",
  "/donate",
  "/about",
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

function safeDate(value: string | null | undefined) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = buildStaticEntries();

  try {
    const [{ listBlog, listIndexableTopics, listNews }, { topicSlugFromLabel }] = await Promise.all([
      import("@/lib/postgres-repository"),
      import("@/lib/topic-taxonomy")
    ]);

    const [newsEntries, blogEntries, topics] = await Promise.all([
      listNews(10000, "published"),
      listBlog(5000, "published"),
      listIndexableTopics(5000)
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

    return [...staticEntries, ...newsSitemapEntries, ...blogSitemapEntries, ...topicEntries];
  } catch (error) {
    console.error("[sitemap] failed to build dynamic sitemap", error);
    return staticEntries;
  }
}
