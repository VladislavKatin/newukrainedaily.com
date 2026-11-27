import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Form endpoints, not pages.
        disallow: ["/api/"]
      }
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`, `${baseUrl}/world-sitemap.xml`]
  };
}
