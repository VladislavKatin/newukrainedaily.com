import process from "node:process";

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeBaseUrl() {
  const configured = readEnv("PUBLIC_BASE_URL");
  return (configured || "http://localhost:3000").replace(/\/$/, "");
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();

  try {
    return {
      status: response.status,
      ok: response.ok,
      body: JSON.parse(text)
    };
  } catch {
    return {
      status: response.status,
      ok: response.ok,
      body: text
    };
  }
}

async function runStep(baseUrl, secret, route) {
  const url = `${baseUrl}${route}`;
  console.log(`\n[smoke] POST ${url}`);

  const result = await requestJson(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  console.log(`[smoke] status=${result.status}`);
  console.log(JSON.stringify(result.body, null, 2));

  if (!result.ok) {
    throw new Error(`Smoke step failed for ${route} with status ${result.status}`);
  }
}

async function fetchStatus(baseUrl, secret, label) {
  const url = `${baseUrl}/api/internal/status`;
  console.log(`\n[smoke] GET ${url} (${label})`);

  const result = await requestJson(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  console.log(`[smoke] status=${result.status}`);
  console.log(JSON.stringify(result.body, null, 2));

  if (!result.ok) {
    throw new Error(`Status check failed (${label}) with status ${result.status}`);
  }
}

async function main() {
  const cronSecret = readEnv("CRON_SECRET");
  const baseUrl = normalizeBaseUrl();

  if (!cronSecret) {
    throw new Error("Missing CRON_SECRET");
  }

  console.log(`[smoke] baseUrl=${baseUrl}`);

  await fetchStatus(baseUrl, cronSecret, "before");

  for (const route of [
    "/api/cron/fetch-news",
    "/api/cron/rewrite-news",
    "/api/cron/generate-images",
    "/api/cron/publish"
  ]) {
    await runStep(baseUrl, cronSecret, route);
  }

  await fetchStatus(baseUrl, cronSecret, "after");

  console.log("\n[smoke] completed");
}

main().catch((error) => {
  console.error(`[smoke] ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
