import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/content-types";
import { absoluteUrl, getPublisherLogoUrl, siteConfig } from "@/lib/site";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
};

// Dates from the database can arrive as Date#toString() text
// ("Thu Nov 26 2026 18:44:00 GMT+0000 ..."); Google needs ISO 8601.
export function toIsoDate(value: string | Date | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Search engines show ~155-160 characters; cut at a word boundary.
export function clampDescription(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= max) {
    return clean;
  }

  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}

// Share images must be PNG/JPG; the .svg artwork paths map to the PNG cards
// generated at build time.
function shareImagePath(imagePath?: string) {
  const value = imagePath || siteConfig.defaultOgImage;
  return /\/og-[a-z-]+\.svg$/.test(value) ? value.replace(/\.svg$/, ".png") : value;
}

export function buildMetadata({ title, description, path, keywords, imagePath, imageAlt }: MetadataInput): Metadata {
  const defaultImage = absoluteUrl(shareImagePath(imagePath));
  const defaultImageAlt = imageAlt || title;
  const pageNumber = Number(path.match(/\/page\/(\d+)$/)?.[1] || "1");
  // Paginated archive pages get their own description instead of repeating page 1.
  const pageDescription = clampDescription(pageNumber > 1 ? `Page ${pageNumber}. ${description}` : description);

  return {
    title,
    description: pageDescription,
    keywords,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description: pageDescription,
      url: absoluteUrl(path),
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: defaultImageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pageDescription,
      images: [defaultImage]
    }
  };
}

export function buildArticleMetadata(entry: ContentEntry): Metadata {
  const path = `/${entry.type}/${entry.slug}`;
  const hasGeneratedImage = Boolean(entry.generatedImageUrl);
  const hasPreviewImage = Boolean(entry.previewImageUrl);
  const imageUrl =
    entry.generatedImageUrl ||
    entry.previewImageUrl ||
    entry.imageUrl ||
    absoluteUrl(siteConfig.defaultOgImage);
  const imageAlt = hasGeneratedImage
    ? entry.generatedImageAlt || entry.imageAlt || entry.title
    : hasPreviewImage
      ? entry.previewImageAlt || entry.imageAlt || entry.title
      : entry.imageAlt || entry.title;
  const description = clampDescription(entry.description);

  return {
    title: entry.title,
    description,
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
      description,
      url: absoluteUrl(path),
      type: "article",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      publishedTime: toIsoDate(entry.publishedAt),
      modifiedTime: toIsoDate(entry.updatedAt || entry.publishedAt),
      authors: [siteConfig.publisherName],
      tags: entry.tags,
      images: [
        {
          url: imageUrl,
          alt: imageAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: [imageUrl]
    }
  };
}

export function buildArticleJsonLd(entry: ContentEntry) {
  const hasGeneratedImage = Boolean(entry.generatedImageUrl);
  const hasPreviewImage = Boolean(entry.previewImageUrl);
  const jsonLdImage =
    entry.generatedImageUrl ||
    entry.previewImageUrl ||
    entry.imageUrl ||
    absoluteUrl(siteConfig.defaultOgImage);
  const jsonLdImageAlt = hasGeneratedImage
    ? entry.generatedImageAlt || entry.imageAlt || entry.title
    : hasPreviewImage
      ? entry.previewImageAlt || entry.imageAlt || entry.title
      : entry.imageAlt || entry.title;

  return {
    "@context": "https://schema.org",
    "@type": entry.type === "news" ? "NewsArticle" : "Article",
    headline: entry.title,
    description: clampDescription(entry.description),
    datePublished: toIsoDate(entry.publishedAt),
    dateModified: toIsoDate(entry.updatedAt || entry.publishedAt),
    author: {
      "@type": "Organization",
      name: siteConfig.publisherName,
      url: absoluteUrl("/newsroom")
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: siteConfig.name,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: getPublisherLogoUrl()
      }
    },
    mainEntityOfPage: absoluteUrl(`/${entry.type}/${entry.slug}`),
    isAccessibleForFree: true,
    articleSection: entry.storyFormat || entry.tags[0] || entry.type,
    about: entry.primaryTopic || entry.tags[0] || undefined,
    keywords: entry.tags.join(", "),
    image: [
      {
        "@type": "ImageObject",
        url: jsonLdImage,
        caption: jsonLdImageAlt
      }
    ]
  };
}

// Site-wide identity for Google (knowledge panel, sitelinks, publisher logo).
export function buildSiteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: getPublisherLogoUrl(),
        width: 512,
        height: 512
      },
      description: siteConfig.description,
      publishingPrinciples: absoluteUrl("/editorial-policy"),
      correctionsPolicy: absoluteUrl("/corrections"),
      masthead: absoluteUrl("/newsroom")
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      inLanguage: "en",
      publisher: { "@id": absoluteUrl("/#organization") }
    }
  ];
}

export function buildBreadcrumbJsonLd(entry: ContentEntry) {
  const sectionLabel = entry.type === "news" ? "News" : "Blog";
  const sectionPath = entry.type === "news" ? "/news" : "/blog";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: sectionLabel,
        item: absoluteUrl(sectionPath)
      },
      {
        "@type": "ListItem",
        position: 3,
        name: entry.title,
        item: absoluteUrl(`/${entry.type}/${entry.slug}`)
      }
    ]
  };
}
