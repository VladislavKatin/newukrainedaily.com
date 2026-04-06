import "server-only";
import type { PoolClient } from "pg";
import { query, withTransaction } from "@/lib/db";

export type WorldDigestItemRecord = {
  id: string;
  digestDate: string;
  position: number;
  title: string;
  summary: string;
  imageUrl: string | null;
  imageAlt: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorldDigestItemInput = {
  position: number;
  title: string;
  summary: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt?: string | null;
};

function hasWorldDigestDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.DIRECT_URL);
}

function mapWorldDigestItem(row: Record<string, unknown>): WorldDigestItemRecord {
  return {
    id: String(row.id),
    digestDate: String(row.digest_date),
    position: Number(row.position),
    title: String(row.title),
    summary: String(row.summary),
    imageUrl: row.image_url ? String(row.image_url) : null,
    imageAlt: row.image_alt ? String(row.image_alt) : null,
    sourceName: String(row.source_name),
    sourceUrl: String(row.source_url),
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function runClientQuery<T extends Record<string, unknown>>(client: PoolClient | null, text: string, values: unknown[]) {
  if (client) {
    return client.query<T>(text, values);
  }

  return query<T>(text, values);
}

export async function listWorldDigestItemsByDate(digestDate: string) {
  if (!hasWorldDigestDatabase()) {
    return [] satisfies WorldDigestItemRecord[];
  }

  const result = await query(
    `
      select *
      from world_digest_items
      where digest_date = $1::date
      order by position asc, published_at desc nulls last, created_at asc
    `,
    [digestDate]
  );

  return result.rows.map(mapWorldDigestItem);
}

export async function listRecentWorldDigestDates(limit = 14) {
  if (!hasWorldDigestDatabase()) {
    return [] satisfies string[];
  }

  const result = await query<{ digest_date: string }>(
    `
      select distinct digest_date::text as digest_date
      from world_digest_items
      order by digest_date desc
      limit $1
    `,
    [limit]
  );

  return result.rows.map((row) => String(row.digest_date));
}

export async function listWorldDigestDatesForSitemap(limit = 365) {
  return listRecentWorldDigestDates(limit);
}

export async function getLatestWorldDigestDate() {
  if (!hasWorldDigestDatabase()) {
    return null;
  }

  const result = await query<{ digest_date: string }>(
    `
      select digest_date::text as digest_date
      from world_digest_items
      order by digest_date desc
      limit 1
    `
  );

  return result.rows[0] ? String(result.rows[0].digest_date) : null;
}

export async function countWorldDigestItemsByDate(digestDate: string) {
  if (!hasWorldDigestDatabase()) {
    return 0;
  }

  const result = await query<{ count: string }>(
    `
      select count(*)::text as count
      from world_digest_items
      where digest_date = $1::date
    `,
    [digestDate]
  );

  return Number(result.rows[0]?.count ?? "0");
}

export async function replaceWorldDigestForDate(digestDate: string, items: CreateWorldDigestItemInput[]) {
  if (!hasWorldDigestDatabase()) {
    throw new Error("World digest database is not configured.");
  }

  return withTransaction(async (client) => {
    await runClientQuery(client, `delete from world_digest_items where digest_date = $1::date`, [digestDate]);

    const created: WorldDigestItemRecord[] = [];
    for (const item of items) {
      const result = await runClientQuery<Record<string, unknown>>(
        client,
        `
          insert into world_digest_items (
            digest_date, position, title, summary, image_url, image_alt, source_name, source_url, published_at
          ) values (
            $1::date, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz
          )
          returning *
        `,
        [
          digestDate,
          item.position,
          item.title,
          item.summary,
          item.imageUrl ?? null,
          item.imageAlt ?? null,
          item.sourceName,
          item.sourceUrl,
          item.publishedAt ?? null
        ]
      );

      created.push(mapWorldDigestItem(result.rows[0]));
    }

    return created;
  });
}
