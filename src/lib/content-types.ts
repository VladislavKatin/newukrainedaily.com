export type EntryType = "news" | "blog";

export type ContentEntry = {
  id: string;
  type: EntryType;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  lead?: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  body: string[];
  sourceAttribution?: string;
  sourceUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  previewImageUrl?: string;
  previewImageAlt?: string;
  previewImageCaption?: string;
  generatedImageUrl?: string;
  generatedImageAlt?: string;
  generatedImageCaption?: string;
  status: "draft" | "scheduled" | "published";
  featured?: boolean;
};
