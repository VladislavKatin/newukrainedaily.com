import type { MetadataRoute } from "next";
import { getAllEntries, getAllTags } from "@/lib/content";
import { absoluteUrl } from "@/lib/site";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, tags] = await Promise.all([getAllEntries(), getAllTags()]);
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

  const dynamicEntries = entries.map((entry) => ({
    url: absoluteUrl(`/${entry.type}/${entry.slug}`),
    lastModified: new Date(entry.updatedAt || entry.publishedAt),
    changeFrequency: (entry.type === "news" ? "hourly" : "weekly") as ChangeFrequency,
    priority: entry.type === "news" ? 0.9 : 0.8
  }));

  const topicEntries = tags.map((tag) => ({
    url: absoluteUrl(`/topic/${tag}`),
    lastModified: new Date(),
    changeFrequency: "daily" as ChangeFrequency,
    priority: 0.75
  }));

  return [...staticEntries, ...dynamicEntries, ...topicEntries];
}
