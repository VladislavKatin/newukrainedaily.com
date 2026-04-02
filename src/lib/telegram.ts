import "server-only";
import { getEnv } from "@/lib/env";

type TelegramStatus = "success" | "warning" | "error" | "info";

type SendTelegramMessageInput = {
  title: string;
  text?: string;
  status?: TelegramStatus;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildPrefix(status: TelegramStatus) {
  switch (status) {
    case "success":
      return "[УСПЕХ]";
    case "warning":
      return "[ПРЕДУПРЕЖДЕНИЕ]";
    case "error":
      return "[ОШИБКА]";
    default:
      return "[ИНФО]";
  }
}

export function isTelegramConfigured() {
  const env = getEnv();
  return Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramMessage(input: SendTelegramMessageInput) {
  const env = getEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram is not configured");
  }

  const apiBase = (env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");
  const lines = [`${buildPrefix(input.status || "info")} <b>${escapeHtml(input.title)}</b>`];

  if (input.text) {
    lines.push(escapeHtml(input.text));
  }

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: lines.join("\n\n"),
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (env.TELEGRAM_MESSAGE_THREAD_ID) {
    body.message_thread_id = Number(env.TELEGRAM_MESSAGE_THREAD_ID);
  }

  const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Telegram API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}
