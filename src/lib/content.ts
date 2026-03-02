import "server-only";
import type { ContentEntry, EntryType } from "@/lib/content-types";
import { getContentRepository } from "@/lib/content-source";

export async function getAllEntries() {
  const repository = await getContentRepository();
  return repository.getAllEntries();
}

export async function getEntriesByType(type: EntryType) {
  const repository = await getContentRepository();
  return repository.getEntriesByType(type);
}

export async function getEntriesByTypePage(
  type: EntryType,
  options: { limit: number; offset: number }
) {
  const repository = await getContentRepository();
  return repository.getEntriesByTypePage(type, options);
}

export async function getEntry(type: EntryType, slug: string) {
  const repository = await getContentRepository();
  return repository.getEntry(type, slug);
}

export async function getAllTags() {
  const repository = await getContentRepository();
  return repository.getAllTags();
}

export async function getEntriesByTag(tag: string) {
  const repository = await getContentRepository();
  return repository.getEntriesByTag(tag);
}

export async function getEntriesByTagPage(tag: string, options: { limit: number; offset: number }) {
  const repository = await getContentRepository();
  return repository.getEntriesByTagPage(tag, options);
}

export async function getTopic(tag: string) {
  const repository = await getContentRepository();
  return repository.getTopic(tag);
}

export type { ContentEntry, EntryType };
