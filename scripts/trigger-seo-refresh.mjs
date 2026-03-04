import fs from "node:fs";
import path from "node:path";

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    env[key] = value;
  }

  return env;
}

async function main() {
  const cwd = process.cwd();
  const envLocal = loadEnvFromFile(path.join(cwd, ".env.local"));
  const envFile = loadEnvFromFile(path.join(cwd, ".env"));
  const envVercel = loadEnvFromFile(path.join(cwd, ".env.vercel"));
  const merged = { ...envFile, ...envLocal, ...envVercel, ...process.env };

  const baseUrl = String(merged.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const cronSecret = String(merged.CRON_SECRET || "");

  if (!baseUrl || !cronSecret) {
    throw new Error("PUBLIC_BASE_URL and CRON_SECRET are required in .env.local/.env");
  }

  const url = `${baseUrl}/api/cron/seo-refresh`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json"
    }
  });

  const body = await response.text();
  console.log(`[trigger-seo-refresh] status=${response.status}`);
  console.log(body);

  if (!response.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[trigger-seo-refresh] failed:", error);
  process.exitCode = 1;
});
