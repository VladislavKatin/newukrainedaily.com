import fs from "node:fs";
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
    maxHoursWithoutNews: 24,
    minItems: 1
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    } else if (arg.startsWith("--max-hours-without-news=")) {
      options.maxHoursWithoutNews = Math.max(
        1,
        Number(arg.slice("--max-hours-without-news=".length)) || options.maxHoursWithoutNews
      );
    } else if (arg.startsWith("--min-items=")) {
      options.minItems = Math.max(1, Number(arg.slice("--min-items=".length)) || options.minItems);
    }
  }

  return options;
}

function extractTagValues(xml, tagName) {
  const pattern = new RegExp(`<${tagName}>(.*?)</${tagName}>`, "gis");
  return Array.from(xml.matchAll(pattern), (match) => match[1].trim()).filter(Boolean);
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function writeSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  fs.appendFileSync(summaryPath, lines.join("\n") + "\n");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "newukrainedaily-publishing-check/1.0" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const xml = await fetchText(`${options.baseUrl}/feed.xml`);

  const links = extractTagValues(xml, "link")
    .map(decodeXml)
    .filter((url) => url.startsWith(`${options.baseUrl}/news/`));
  const dates = extractTagValues(xml, "pubDate");

  if (links.length < options.minItems) {
    throw new Error(`feed has only ${links.length} news items, expected at least ${options.minItems}`);
  }

  const latestDateRaw = dates[0];
  if (!latestDateRaw) {
    throw new Error("feed.xml is missing pubDate for the latest item");
  }

  const latestDate = new Date(latestDateRaw);
  if (Number.isNaN(latestDate.getTime())) {
    throw new Error(`invalid latest pubDate: ${latestDateRaw}`);
  }

  const ageHours = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
  const latestUrl = links[0] || "n/a";

  const summary = [
    "## Publishing Monitor",
    `- Base URL: ${options.baseUrl}`,
    `- Feed items checked: ${links.length}`,
    `- Latest article: ${latestUrl}`,
    `- Latest pubDate: ${latestDate.toISOString()}`,
    `- Age hours: ${ageHours.toFixed(2)}`,
    `- Threshold hours: ${options.maxHoursWithoutNews}`
  ];

  for (const line of summary) {
    console.log(`[publishing] ${line.replace(/^[-# ]+/, "")}`);
  }
  writeSummary(summary);

  if (ageHours > options.maxHoursWithoutNews) {
    throw new Error(
      `latest published news is ${ageHours.toFixed(2)}h old, threshold is ${options.maxHoursWithoutNews}h`
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[publishing] failed: ${message}`);
  writeSummary(["## Publishing Monitor", "- Status: failed", `- Error: ${message}`]);
  process.exit(1);
});
