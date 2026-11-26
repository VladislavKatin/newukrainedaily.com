// Runs the content automation directly against the database (no web server needed).
// Used by GitHub Actions before each static rebuild of the site.
//
//   node --conditions=react-server --import tsx scripts/automation.mjs <task> [--count=1] [--date=YYYY-MM-DD]
//
// Tasks: generate, images, publish, world-digest, seo-refresh, ensure-schema
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd());

function readFlag(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.slice(3).find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

async function ensureSchema() {
  const { query } = await import("../src/lib/db");
  const files = ["supabase/audience_poll_responses.sql"];

  for (const file of files) {
    const sql = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    await query(sql);
  }

  return { applied: files };
}

async function worldDigest() {
  const { generateWorldDigestForDate } = await import("../src/lib/world/digest");
  const { worldDigestDateFromDate } = await import("../src/lib/world/date");
  const { listWorldDigestItemsByDate } = await import("../src/lib/world-repository");
  const digestDate = readFlag("date", worldDigestDateFromDate());
  const force = process.argv.includes("--force");

  if (!force) {
    const existing = await listWorldDigestItemsByDate(digestDate);
    if (existing.length > 0) {
      return { digestDate, skipped: true, existingItems: existing.length };
    }
  }

  return { digestDate, ...(await generateWorldDigestForDate(digestDate)) };
}

const tasks = {
  async generate() {
    const { runGeneratePipeline } = await import("../src/lib/pipeline");
    return runGeneratePipeline(Number(readFlag("count", "1")) || 1);
  },
  async images() {
    const { markJobLifecycle, runGenerateImagesJob } = await import("../src/lib/pipeline");
    return markJobLifecycle("image", () => runGenerateImagesJob());
  },
  async publish() {
    const { markJobLifecycle, runPublishJob } = await import("../src/lib/pipeline");
    return markJobLifecycle("publish", () => runPublishJob());
  },
  "world-digest": worldDigest,
  async "seo-refresh"() {
    const { refreshPublishedSeoContent } = await import("../src/lib/seo-refresh");
    return refreshPublishedSeoContent();
  },
  "ensure-schema": ensureSchema
};

async function main() {
  const taskName = process.argv[2];
  const task = tasks[taskName];

  if (!task) {
    throw new Error(`Unknown task "${taskName}". Use one of: ${Object.keys(tasks).join(", ")}`);
  }

  const startedAt = Date.now();
  const result = await task();
  console.log(JSON.stringify({ ok: true, task: taskName, seconds: Math.round((Date.now() - startedAt) / 1000), result }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[automation] ${error instanceof Error ? error.stack || error.message : String(error)}`);
    process.exit(1);
  });
