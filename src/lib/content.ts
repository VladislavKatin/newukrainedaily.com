import "server-only";
import { unstable_cache } from "next/cache";
import type { ContentEntry, EntryType } from "@/lib/content-types";
import { getContentRepository } from "@/lib/content-source";

const getAllEntriesCached = unstable_cache(
  async () => {
    const repository = await getContentRepository();
    return repository.getAllEntries();
  },
  ["content-all-entries"],
  { revalidate: 300 }
);

const getEntriesByTypeCached = unstable_cache(
  async (type: EntryType) => {
    const repository = await getContentRepository();
    return repository.getEntriesByType(type);
  },
  ["content-type"],
  { revalidate: 300 }
);

const getEntriesByTypePageCached = unstable_cache(
  async (type: EntryType, limit: number, offset: number) => {
    const repository = await getContentRepository();
    return repository.getEntriesByTypePage(type, { limit, offset });
  },
  ["content-type-page"],
  { revalidate: 300 }
);

const getEntryCached = unstable_cache(
  async (type: EntryType, slug: string) => {
    const repository = await getContentRepository();
    return repository.getEntry(type, slug);
  },
  ["content-entry"],
  { revalidate: 300 }
);

const getAllTagsCached = unstable_cache(
  async () => {
    const repository = await getContentRepository();
    return repository.getAllTags();
  },
  ["content-all-tags"],
  { revalidate: 300 }
);

const getEntriesByTagCached = unstable_cache(
  async (tag: string) => {
    const repository = await getContentRepository();
    return repository.getEntriesByTag(tag);
  },
  ["content-tag"],
  { revalidate: 300 }
);

const getEntriesByTagPageCached = unstable_cache(
  async (tag: string, limit: number, offset: number) => {
    const repository = await getContentRepository();
    return repository.getEntriesByTagPage(tag, { limit, offset });
  },
  ["content-tag-page"],
  { revalidate: 300 }
);

const getTopicCached = unstable_cache(
  async (tag: string) => {
    const repository = await getContentRepository();
    return repository.getTopic(tag);
  },
  ["content-topic"],
  { revalidate: 300 }
);

export async function getAllEntries() {
  return getAllEntriesCached();
}

export async function getEntriesByType(type: EntryType) {
  return getEntriesByTypeCached(type);
}

export async function getEntriesByTypePage(
  type: EntryType,
  options: { limit: number; offset: number }
) {
  return getEntriesByTypePageCached(type, options.limit, options.offset);
}

export async function getEntry(type: EntryType, slug: string) {
  return getEntryCached(type, slug);
}

export async function getAllTags() {
  return getAllTagsCached();
}

export async function getEntriesByTag(tag: string) {
  return getEntriesByTagCached(tag);
}

export async function getEntriesByTagPage(tag: string, options: { limit: number; offset: number }) {
  return getEntriesByTagPageCached(tag, options.limit, options.offset);
}

export async function getTopic(tag: string) {
  return getTopicCached(tag);
}

export type { ContentEntry, EntryType };
