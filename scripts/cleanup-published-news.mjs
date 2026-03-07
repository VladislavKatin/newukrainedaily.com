import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
const DEFAULT_SWAP_LIMIT = 5;
const PUBLISHED_SCAN_LIMIT = 30;
const DRAFT_SCAN_LIMIT = 80;

const SOURCE_PRIORITY = {
  "ukrinform en": 12,
  "ukrinform ua": 12,
  "ukrainska pravda en": 11,
  "ukrainska pravda en news": 11,
  "ukrainska pravda ua": 11,
  "interfax ukraine": 10,
  "rbc ukraine": 9,
  "radio svoboda": 8,
  "tsn ukraine": 7,
  "nv ukraine": 7,
  obozrevatel: 5,
  "european pravda ua": 5
};

const PREFERRED_TOPICS = new Set([
  "ukraine",
  "security",
  "diplomacy",
  "humanitarian",
  "energy",
  "economy",
  "russia",
  "us",
  "eu",
  "nato"
]);

const WEAK_MARKERS = [
  "airport safety",
  "global challenges",
  "gulf region",
  "healing",
  "cultural identity",
  "ukrainians abroad",
  "iranian fleet",
  "astrology",
  "horoscope",
  "sleeping head-first",
  "blackcurrants"
];

loadLocalEnv(process.cwd());

for (const fileName of [".env.vercel.prod"]) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");

    process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 4
});

function normalizeToken(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function getSourcePriority(sourceName) {
  return SOURCE_PRIORITY[normalizeToken(sourceName)] ?? 0;
}

function buildText(row) {
  return normalizeToken(
    [
      row.title,
      row.dek,
      row.summary,
      row.why_it_matters,
      ...(row.tags || []),
      ...(row.topics || [])
    ].join(" ")
  );
}

function scoreDraft(row) {
  const text = buildText(row);
  const normalizedPrimaryTopic = normalizeToken(row.primary_topic);
  const sourcePriority = getSourcePriority(row.source_name);
  const tagBonus = [...(row.tags || []), ...(row.topics || [])]
    .map(normalizeToken)
    .reduce((total, token) => total + (PREFERRED_TOPICS.has(token) ? 1 : 0), 0);

  let score = sourcePriority * 10;
  score += tagBonus * 3;
  score += PREFERRED_TOPICS.has(normalizedPrimaryTopic) ? 8 : 0;
  score += row.preview_image_url ? 4 : 0;
  score += row.generated_image_url ? 5 : 0;
  score += row.cover_image_url ? 4 : 0;
  score += Number(row.quality_score || 0) * 10;
  score += Number(row.char_count || 0) >= 1800 ? 4 : 0;
  score += Number(row.word_count || 0) >= 300 ? 2 : 0;

  if (WEAK_MARKERS.some((marker) => text.includes(marker))) {
    score -= 50;
  }

  return score;
}

function scoreWeakPublished(row) {
  const text = buildText(row);
  const normalizedPrimaryTopic = normalizeToken(row.primary_topic);
  const sourcePriority = getSourcePriority(row.source_name);
  const relevantSignals = [...(row.tags || []), ...(row.topics || [])]
    .map(normalizeToken)
    .filter((token) => PREFERRED_TOPICS.has(token)).length;

  let score = 0;
  score += sourcePriority <= 4 ? 20 : 0;
  score += sourcePriority <= 1 ? 12 : 0;
  score += PREFERRED_TOPICS.has(normalizedPrimaryTopic) ? -10 : 12;
  score += relevantSignals === 0 ? 12 : 0;
  score += row.preview_image_url ? 0 : 6;
  score += row.generated_image_url ? 0 : 8;
  score += Number(row.quality_score || 0) < 0.85 ? 10 : 0;
  score += Number(row.char_count || 0) < 1500 ? 6 : 0;

  for (const marker of WEAK_MARKERS) {
    if (text.includes(marker)) {
      score += 25;
    }
  }

  return score;
}

async function backup(payload) {
  const backupDir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `published-news-cleanup-${stamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(payload, null, 2));
  return backupPath;
}

async function fetchCandidates() {
  const [publishedResult, draftResult] = await Promise.all([
    pool.query(
      `
        select id, slug, title, dek, summary, why_it_matters, tags, topics, primary_topic,
               source_name, source_url, preview_image_url, generated_image_url, cover_image_url,
               quality_score, char_count, word_count, published_at, created_at
        from news_items
        where status = 'published'
        order by published_at desc nulls last, created_at desc
        limit $1
      `,
      [PUBLISHED_SCAN_LIMIT]
    ),
    pool.query(
      `
        select id, slug, title, dek, summary, why_it_matters, tags, topics, primary_topic,
               source_name, source_url, preview_image_url, generated_image_url, cover_image_url,
               quality_score, char_count, word_count, published_at, created_at
        from news_items
        where status = 'draft'
          and cover_image_url is not null
          and og_image_url is not null
          and generated_image_url is not null
        order by coalesce(published_at, created_at) desc, created_at desc
        limit $1
      `,
      [DRAFT_SCAN_LIMIT]
    )
  ]);

  return {
    published: publishedResult.rows,
    drafts: draftResult.rows
  };
}

function selectSwaps(publishedRows, draftRows, limit) {
  const weakPublished = publishedRows
    .map((row) => ({ ...row, weakScore: scoreWeakPublished(row) }))
    .filter((row) => row.weakScore >= 22)
    .sort((left, right) => right.weakScore - left.weakScore);

  const strongDrafts = draftRows
    .map((row) => ({ ...row, draftScore: scoreDraft(row) }))
    .filter((row) => row.draftScore >= 70)
    .sort((left, right) => right.draftScore - left.draftScore);

  const swaps = [];
  const usedDraftIds = new Set();

  for (const weak of weakPublished) {
    const replacement = strongDrafts.find((draft) => {
      if (usedDraftIds.has(draft.id)) {
        return false;
      }

      if (normalizeToken(draft.source_url) === normalizeToken(weak.source_url)) {
        return false;
      }

      return true;
    });

    if (!replacement) {
      continue;
    }

    swaps.push({ weak, replacement });
    usedDraftIds.add(replacement.id);

    if (swaps.length >= limit) {
      break;
    }
  }

  return {
    weakPublished,
    strongDrafts,
    swaps
  };
}

async function applySwaps(swaps) {
  if (swaps.length === 0) {
    return { demoted: 0, promoted: 0 };
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    for (const [index, swap] of swaps.entries()) {
      const publishedAt = new Date(Date.now() - index * 60_000).toISOString();

      await client.query(
        `
          update news_items
          set
            status = 'draft',
            published_at = null,
            updated_at = timezone('utc', now())
          where id = $1
        `,
        [swap.weak.id]
      );

      await client.query(
        `
          update news_items
          set
            status = 'published',
            published_at = coalesce(published_at, $2::timestamptz),
            updated_at = timezone('utc', now())
          where id = $1
        `,
        [swap.replacement.id, publishedAt]
      );
    }

    await client.query("commit");
    return { demoted: swaps.length, promoted: swaps.length };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const swapLimit = Math.max(
    1,
    Number.parseInt(String(process.env.CLEANUP_SWAP_LIMIT || DEFAULT_SWAP_LIMIT), 10) || DEFAULT_SWAP_LIMIT
  );
  const { published, drafts } = await fetchCandidates();
  const selection = selectSwaps(published, drafts, swapLimit);

  const backupPath = await backup({
    createdAt: new Date().toISOString(),
    swapLimit,
    selection: {
      weakPublished: selection.weakPublished,
      strongDrafts: selection.strongDrafts,
      swaps: selection.swaps
    }
  });

  const result = await applySwaps(selection.swaps);

  console.log(
    JSON.stringify(
      {
        ok: true,
        backupPath,
        swapLimit,
        demoted: result.demoted,
        promoted: result.promoted,
        swaps: selection.swaps.map((swap) => ({
          demotedSlug: swap.weak.slug,
          demotedScore: swap.weak.weakScore,
          promotedSlug: swap.replacement.slug,
          promotedScore: swap.replacement.draftScore
        }))
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("[cleanup-published-news] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
