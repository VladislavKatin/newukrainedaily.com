// One-time helper: copies secrets from .env.vercel.prod (plus CLOUDFLARE_* from the shell) into
//   --pages   Cloudflare Pages Functions (newsletter + poll)  -> needs `wrangler login`
//   --github  GitHub Actions secrets for the hourly automation -> needs `gh auth login`
// Values are passed through stdin/temp files and never printed.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ENV_FILE = path.join(process.cwd(), process.env.SECRETS_ENV_FILE || ".env.vercel.prod");
const PAGES_PROJECT = "newukrainedaily";

const PAGES_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
const GITHUB_KEYS = [
  "DATABASE_URL",
  "CRON_SECRET",
  "AI_API_KEY",
  "LEONARDO_API_KEY",
  "LEONARDO_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "GOOGLE_ANALYTICS_ID",
  "GOOGLE_SITE_VERIFICATION",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID"
];

function readEnvFile() {
  const values = {};
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  for (const key of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]) {
    if (process.env[key]) values[key] = process.env[key];
  }
  return values;
}

function run(command, args, input) {
  const result = spawnSync(command, args, {
    input,
    stdio: [input === undefined ? "inherit" : "pipe", "inherit", "inherit"],
    shell: process.platform === "win32"
  });
  return result.status === 0;
}

const env = readEnvFile();

if (process.argv.includes("--pages")) {
  const payload = Object.fromEntries(PAGES_KEYS.filter((key) => env[key]).map((key) => [key, env[key]]));
  const tmp = path.join(os.tmpdir(), `pages-secrets-${Date.now()}.json`);
  fs.writeFileSync(tmp, JSON.stringify(payload));
  try {
    const ok = run("npx", ["--yes", "wrangler@4", "pages", "secret", "bulk", tmp, "--project-name", PAGES_PROJECT]);
    console.log(ok ? `Pages secrets set: ${Object.keys(payload).join(", ")}` : "Pages secrets FAILED");
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

if (process.argv.includes("--github")) {
  for (const key of GITHUB_KEYS) {
    if (!env[key]) {
      console.log(`skip ${key} (not set)`);
      continue;
    }
    const ok = run("gh", ["secret", "set", key, "--repo", "VladislavKatin/newukrainedaily.com"], env[key]);
    console.log(`${ok ? "set " : "FAILED "}${key}`);
  }
}
