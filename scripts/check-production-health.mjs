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
    newsLimit: 1,
    blogLimit: 1
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    } else if (arg.startsWith("--news=")) {
      options.newsLimit = Math.max(0, Number(arg.slice("--news=".length)) || options.newsLimit);
    } else if (arg.startsWith("--blog=")) {
      options.blogLimit = Math.max(0, Number(arg.slice("--blog=".length)) || options.blogLimit);
    }
  }

  return options;
}

function extractTagValues(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, "gis");
  return Array.from(xml.matchAll(pattern), (match) => match[1].trim()).filter(Boolean);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "newukrainedaily-healthcheck/1.0" },
    cache: "no-store"
  });

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  };
}

function expectIncludes(label, text, markers) {
  for (const marker of markers) {
    if (!text.includes(marker)) {
      throw new Error(`${label} is missing marker: ${marker}`);
    }
  }
}

async function collectArticleUrls(baseUrl, newsLimit, blogLimit) {
  const [newsFeed, blogFeed] = await Promise.all([
    fetchText(`${baseUrl}/feed.xml`),
    fetchText(`${baseUrl}/blog/feed.xml`)
  ]);

  const newsUrls = extractTagValues(newsFeed.text, "link")
    .filter((url) => url.startsWith(`${baseUrl}/news/`))
    .slice(0, newsLimit);
  const blogUrls = extractTagValues(blogFeed.text, "link")
    .filter((url) => url.startsWith(`${baseUrl}/blog/`))
    .slice(0, blogLimit);

  return { newsUrls, blogUrls };
}

async function checkPage(url, markers = []) {
  const response = await fetchText(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  if (markers.length > 0) {
    expectIncludes(url, response.text, markers);
  }
  console.log(`[health] ok ${url}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { baseUrl, newsLimit, blogLimit } = options;

  const { newsUrls, blogUrls } = await collectArticleUrls(baseUrl, newsLimit, blogLimit);

  const checks = [
    () => checkPage(`${baseUrl}/`, ["Lead Story", "Latest"]),
    () => checkPage(`${baseUrl}/news`, ["Lead report", "Latest updates"]),
    () => checkPage(`${baseUrl}/world`, ["World News Digest", "Today&apos;s international digest"]),
    () => checkPage(`${baseUrl}/blog`, ["Analysis and explainers"]),
    () => checkPage(`${baseUrl}/contact`, ["Zaporizhzhia", "Google Maps"]),
    () => checkPage(`${baseUrl}/sitemap.xml`, ["/newsroom", "/corrections", "/world"]),
    () => checkPage(`${baseUrl}/feed.xml`, ["<rss", "<item>"]),
    () => checkPage(`${baseUrl}/blog/feed.xml`, ["<rss", "<item>"])
  ];

  for (const url of newsUrls) {
    checks.push(() => checkPage(url, ["Related News", "Photo:"]));
  }

  for (const url of blogUrls) {
    checks.push(() => checkPage(url, ["Related Posts"]));
  }

  for (const check of checks) {
    await check();
  }

  console.log(`[health] completed ${checks.length} checks`);
}

main().catch((error) => {
  console.error(`[health] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
