import fs from "node:fs";
import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd(), [".env.vercel.prod", ".env.local", ".env"]);

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
    minItems: 1,
    startHourKyiv: 6
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    } else if (arg.startsWith("--min-items=")) {
      const parsed = Number(arg.slice("--min-items=".length));
      if (Number.isFinite(parsed)) {
        options.minItems = Math.max(1, parsed);
      }
    } else if (arg.startsWith("--start-hour-kyiv=")) {
      const parsed = Number(arg.slice("--start-hour-kyiv=".length));
      if (Number.isFinite(parsed)) {
        options.startHourKyiv = Math.max(0, parsed);
      }
    }
  }

  return options;
}

function getKyivDigestDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getKyivHour(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      hour12: false
    }).format(date)
  );
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
    headers: { "user-agent": "newukrainedaily-world-monitor/1.0" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const digestDate = getKyivDigestDate();
  const kyivHour = getKyivHour();
  const html = await fetchText(`${options.baseUrl}/world`);
  const countMatch = html.match(/>(\d+)\s*(?:<!-- -->\s*)?stories today</i);
  const itemCount = Number(countMatch?.[1] || "0");

  const summary = [
    "## World Digest Monitor",
    `- Base URL: ${options.baseUrl}`,
    `- Digest date (Kyiv): ${digestDate}`,
    `- Kyiv hour now: ${kyivHour}`,
    `- Stories today: ${itemCount}`,
    `- Minimum required after threshold: ${options.minItems}`,
    `- Threshold hour (Kyiv): ${options.startHourKyiv}`
  ];

  for (const line of summary) {
    console.log(`[world-monitor] ${line.replace(/^[-# ]+/, "")}`);
  }
  writeSummary(summary);

  if (kyivHour < options.startHourKyiv) {
    return;
  }

  if (itemCount < options.minItems) {
    throw new Error(
      `world digest for ${digestDate} has ${itemCount} items after ${options.startHourKyiv}:00 Kyiv, expected at least ${options.minItems}`
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[world-monitor] failed: ${message}`);
  writeSummary(["## World Digest Monitor", "- Status: failed", `- Error: ${message}`]);
  process.exit(1);
});
