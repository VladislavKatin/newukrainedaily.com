// Shared helpers for Cloudflare Pages Functions.
// Secrets (set with `wrangler pages secret`): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_MESSAGE_THREAD_ID (optional).

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function cleanString(value, max) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function supabaseInsert(env, table, row, { onConflict } = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured");
  }

  const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      prefer: onConflict
        ? "resolution=merge-duplicates,return=representation"
        : "return=representation"
    },
    body: JSON.stringify(row)
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} insert failed: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function notifyTelegram(env, title, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const body = {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: `[ИНФО] <b>${escapeHtml(title)}</b>\n\n${escapeHtml(text)}`,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (env.TELEGRAM_MESSAGE_THREAD_ID) {
    body.message_thread_id = Number(env.TELEGRAM_MESSAGE_THREAD_ID);
  }

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}
