import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd());

function resolveDefaultBaseUrl() {
  const configured = (process.env.PUBLIC_BASE_URL || "").trim();

  if (!configured) {
    return "https://www.newukrainedaily.com";
  }

  try {
    const url = new URL(configured);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "https://www.newukrainedaily.com";
    }
    return url.origin;
  } catch {
    return "https://www.newukrainedaily.com";
  }
}

function parseArgs(argv) {
  const options = {
    baseUrl: resolveDefaultBaseUrl(),
    newsLimit: 12,
    blogLimit: 8,
    concurrency: 1
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length);
    } else if (arg.startsWith("--news=")) {
      options.newsLimit = Math.max(0, Number(arg.slice("--news=".length)) || options.newsLimit);
    } else if (arg.startsWith("--blog=")) {
      options.blogLimit = Math.max(0, Number(arg.slice("--blog=".length)) || options.blogLimit);
    } else if (arg.startsWith("--concurrency=")) {
      options.concurrency = Math.max(1, Number(arg.slice("--concurrency=".length)) || options.concurrency);
    }
  }

  options.baseUrl = options.baseUrl.replace(/\/$/, "");
  return options;
}

function extractTagValues(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, "gis");
  return Array.from(xml.matchAll(pattern), (match) => match[1].trim()).filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "newukrainedaily-warmup/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function collectUrls(baseUrl, newsLimit, blogLimit) {
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/news`,
    `${baseUrl}/blog`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/newsroom`,
    `${baseUrl}/editorial-policy`,
    `${baseUrl}/corrections`,
    `${baseUrl}/donate`
  ];

  const [newsFeed, blogFeed] = await Promise.all([
    fetchText(`${baseUrl}/feed.xml`).catch(() => ""),
    fetchText(`${baseUrl}/blog/feed.xml`).catch(() => "")
  ]);

  const newsLinks = extractTagValues(newsFeed, "link")
    .filter((url) => url.startsWith(`${baseUrl}/news/`))
    .slice(0, newsLimit);
  const blogLinks = extractTagValues(blogFeed, "link")
    .filter((url) => url.startsWith(`${baseUrl}/blog/`))
    .slice(0, blogLimit);

  return [...new Set([...urls, ...newsLinks, ...blogLinks])];
}

async function warmUrl(url) {
  const started = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "newukrainedaily-warmup/1.0"
      },
      cache: "no-store"
    });
    await response.arrayBuffer();

    return {
      url,
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - started
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runPool(items, concurrency, worker) {
  const results = [];
  const queue = [...items];

  async function runOne() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) {
        return;
      }

      const result = await worker(item);
      results.push(result);
      await sleep(120);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runOne()));
  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const urls = await collectUrls(options.baseUrl, options.newsLimit, options.blogLimit);

  console.log(`[warmup] base=${options.baseUrl}`);
  console.log(`[warmup] urls=${urls.length}`);

  const results = await runPool(urls, options.concurrency, warmUrl);
  const failures = results.filter((result) => !result.ok);
  const slowest = [...results].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);

  for (const result of results) {
    console.log(`[warmup] ${result.status} ${result.durationMs}ms ${result.url}${result.error ? ` :: ${result.error}` : ""}`);
  }

  console.log(`[warmup] completed=${results.length} failed=${failures.length}`);
  console.log("[warmup] slowest:");
  for (const result of slowest) {
    console.log(`  - ${result.durationMs}ms ${result.url}`);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[warmup] fatal", error);
  process.exit(1);
});
