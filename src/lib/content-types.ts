export type EntryType = "news" | "blog";

export type ContentEntry = {
  id: string;
  type: EntryType;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  tags: string[];
  body: string[];
  sourceUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  status: "draft" | "scheduled" | "published";
  featured?: boolean;
};
