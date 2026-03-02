import type { ContentEntry } from "@/lib/content-types";
import { buildArticleJsonLd } from "@/lib/seo";

export function ArticleJsonLd({ entry }: { entry: ContentEntry }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd(entry)) }}
    />
  );
}
