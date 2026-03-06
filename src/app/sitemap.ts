import type { MetadataRoute } from "next";
import { listBlog, listNews, listTopics } from "@/lib/postgres-repository";
import { absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [newsEntries, blogEntries, topics] = await Promise.all([
    listNews(10000, "published"),
    listBlog(5000, "published"),
    listTopics(1000)
  ]);

  const staticRoutes = [
    "/",
    "/news",
    "/blog",
    "/donate",
    "/about",
    "/editorial-policy",
    "/contact"
  ];

  const staticEntries = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: (route === "/" ? "daily" : "weekly") as ChangeFrequency,
    priority: route === "/" ? 1 : 0.7
  }));

  const newsSitemapEntries = newsEntries.map((entry) => ({
    url: absoluteUrl(`/news/${entry.slug}`),
    lastModified: new Date(entry.updatedAt || entry.publishedAt || entry.createdAt),
    changeFrequency: "hourly" as ChangeFrequency,
    priority: 0.9
  }));

  const blogSitemapEntries = blogEntries.map((entry) => ({
    url: absoluteUrl(`/blog/${entry.slug}`),
    lastModified: new Date(entry.updatedAt || entry.publishedAt || entry.createdAt),
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.8
  }));

  const topicEntries = topics.map((topic) => ({
    url: absoluteUrl(`/topic/${topic.tag}`),
    lastModified: new Date(topic.updatedAt),
    changeFrequency: "daily" as ChangeFrequency,
    priority: 0.75
  }));

  return [...staticEntries, ...newsSitemapEntries, ...blogSitemapEntries, ...topicEntries];
}
