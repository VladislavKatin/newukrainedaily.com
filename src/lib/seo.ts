import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/content-types";
import { absoluteUrl, getPublisherLogoUrl, siteConfig } from "@/lib/site";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

export function buildMetadata({ title, description, path, keywords }: MetadataInput): Metadata {
  const defaultImage = absoluteUrl(siteConfig.defaultOgImage);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultImage]
    }
  };
}

export function buildArticleMetadata(entry: ContentEntry): Metadata {
  const path = `/${entry.type}/${entry.slug}`;
  const imageUrl =
    entry.generatedImageUrl ||
    entry.previewImageUrl ||
    entry.imageUrl ||
    absoluteUrl(siteConfig.defaultOgImage);
  const imageAlt = entry.imageAlt || entry.title;

  return {
    title: entry.title,
    description: entry.description,
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml":
          entry.type === "news" ? absoluteUrl("/feed.xml") : absoluteUrl("/blog/feed.xml")
      }
    },
    robots: {
      index: entry.status === "published",
      follow: entry.status === "published"
    },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: absoluteUrl(path),
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: entry.publishedAt,
      modifiedTime: entry.updatedAt || entry.publishedAt,
      authors: [entry.author],
      tags: entry.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: [imageUrl]
    }
  };
}

export function buildArticleJsonLd(entry: ContentEntry) {
  const jsonLdImage =
    entry.generatedImageUrl ||
    entry.previewImageUrl ||
    entry.imageUrl ||
    absoluteUrl(siteConfig.defaultOgImage);

  return {
    "@context": "https://schema.org",
    "@type": entry.type === "news" ? "NewsArticle" : "Article",
    headline: entry.title,
    description: entry.description,
    datePublished: entry.publishedAt,
    dateModified: entry.updatedAt || entry.publishedAt,
    author: {
      "@type": "Organization",
      name: siteConfig.publisherName
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: getPublisherLogoUrl()
      }
    },
    mainEntityOfPage: absoluteUrl(`/${entry.type}/${entry.slug}`),
    image: [jsonLdImage],
    articleSection: entry.tags[0] || entry.type,
    keywords: entry.tags.join(", ")
  };
}
