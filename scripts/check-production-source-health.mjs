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
    sourceLimit: 50,
    itemsPerSourceLimit: 15,
    minHealthySources: 3
  };

  for (const arg of argv) {
    if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.slice("--base-url=".length).replace(/\/$/, "");
    } else if (arg.startsWith("--source-limit=")) {
      options.sourceLimit = Math.max(1, Number(arg.slice("--source-limit=".length)) || options.sourceLimit);
    } else if (arg.startsWith("--items-per-source-limit=")) {
      options.itemsPerSourceLimit = Math.max(
        1,
        Number(arg.slice("--items-per-source-limit=".length)) || options.itemsPerSourceLimit
      );
    } else if (arg.startsWith("--min-healthy-sources=")) {
      options.minHealthySources = Math.max(
        1,
        Number(arg.slice("--min-healthy-sources=".length)) || options.minHealthySources
      );
    }
  }

  return options;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function writeSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  fs.appendFileSync(summaryPath, lines.join("\n") + "\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cronSecret = requireEnv("CRON_SECRET");
  const url =
    `${options.baseUrl}/api/internal/source-health` +
    `?limit=${options.sourceLimit}&itemsPerSourceLimit=${options.itemsPerSourceLimit}`;

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${cronSecret}`,
      "user-agent": "newukrainedaily-source-health/1.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  const payload = await response.json();

  if (!payload.ok) {
    throw new Error(payload.error || "source-health returned ok=false");
  }

  const checkedSources = Number(payload.checkedSources || 0);
  const healthySources = Number(payload.healthySources || 0);
  const failingSources = Number(payload.failingSources || 0);
  const failingDetails = Array.isArray(payload.details)
    ? payload.details.filter((entry) => !entry.ok || Number(entry.relevantItems || 0) === 0).slice(0, 5)
    : [];

  const summary = [
    "## Мониторинг источников",
    `- Базовый URL: ${options.baseUrl}`,
    `- Проверено источников: ${checkedSources}`,
    `- Здоровых источников: ${healthySources}`,
    `- Проблемных источников: ${failingSources}`,
    `- Минимум здоровых источников: ${options.minHealthySources}`
  ];

  if (failingDetails.length > 0) {
    summary.push("- Примеры проблемных источников:");
    for (const entry of failingDetails) {
      const reason = entry.error || "нет релевантных материалов";
      summary.push(`  - ${entry.name}: ${reason}`);
    }
  }

  for (const line of summary) {
    console.log(`[source-health] ${line.replace(/^[-# ]+/, "")}`);
  }
  writeSummary(summary);

  if (checkedSources === 0) {
    throw new Error("не удалось проверить ни один RSS-источник");
  }

  if (healthySources < options.minHealthySources) {
    throw new Error(
      `слишком мало здоровых источников: ${healthySources} из ${checkedSources}, минимум ${options.minHealthySources}`
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[source-health] failed: ${message}`);
  writeSummary(["## Мониторинг источников", "- Статус: ошибка", `- Детали: ${message}`]);
  process.exit(1);
});
