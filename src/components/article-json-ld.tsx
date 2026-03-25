import type { ContentEntry } from "@/lib/content-types";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo";

export function ArticleJsonLd({ entry }: { entry: ContentEntry }) {
  const payload = [buildArticleJsonLd(entry), buildBreadcrumbJsonLd(entry)];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}