import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd());

function parseArgs(argv) {
  const options = {
    title: "Notification",
    text: "",
    status: "info",
    disableLinkPreview: true,
    parseMode: "HTML"
  };

  for (const arg of argv) {
    if (arg.startsWith("--title=")) {
      options.title = arg.slice("--title=".length);
    } else if (arg.startsWith("--text=")) {
      options.text = arg.slice("--text=".length);
    } else if (arg.startsWith("--status=")) {
      options.status = arg.slice("--status=".length);
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

function buildPrefix(status) {
  switch (status) {
    case "success":
      return "[SUCCESS]";
    case "warning":
      return "[WARNING]";
    case "error":
      return "[ERROR]";
    default:
      return "[INFO]";
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = requireEnv("TELEGRAM_BOT_TOKEN");
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const threadId = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  const apiBase = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org")
    .trim()
    .replace(/\/$/, "");

  const lines = [`${buildPrefix(options.status)} <b>${escapeHtml(options.title)}</b>`];

  if (options.text) {
    lines.push(escapeHtml(options.text));
  }

  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
    const runUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    lines.push(`<a href="${runUrl}">Open workflow run</a>`);
  }

  const body = {
    chat_id: chatId,
    text: lines.join("\n\n"),
    parse_mode: options.parseMode,
    disable_web_page_preview: options.disableLinkPreview
  };

  if (threadId) {
    body.message_thread_id = Number(threadId);
  }

  const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram API ${response.status}: ${text}`);
  }

  const result = await response.json();
  console.log(`[telegram] sent message id=${result.result?.message_id ?? "unknown"}`);
}

main().catch((error) => {
  console.error(`[telegram] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
