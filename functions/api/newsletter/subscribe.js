import { cleanString, json, notifyTelegram, readJson, supabaseInsert } from "../../_lib/shared.js";
import { hasFormsDb, saveSubscriber } from "../../_lib/forms-db.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env, waitUntil }) {
  const payload = await readJson(request);

  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid newsletter signup payload." }, 400);
  }

  // Honeypot field: bots fill it, people never see it.
  if (cleanString(payload.website, 200)) {
    return json({ ok: true, status: "ignored" });
  }

  const email = cleanString(payload.email, 254)?.toLowerCase();
  const name = cleanString(payload.name, 120);
  const sourcePage = cleanString(payload.sourcePage, 240);

  if (!email || !EMAIL_PATTERN.test(email)) {
    return json({ ok: false, error: "Invalid newsletter signup payload." }, 400);
  }

  try {
    let subscriber;
    if (hasFormsDb(env)) {
      subscriber = await saveSubscriber(env, { email, name, sourcePage });
    } else {
      const row = { email, status: "active" };
      if (name) row.name = name;
      if (sourcePage) row.source_page = sourcePage;
      subscriber = await supabaseInsert(env, "newsletter_subscribers", row, { onConflict: "email" });
    }

    const lines = [
      `Email: ${email}`,
      name ? `Name: ${name}` : null,
      sourcePage ? `Source page: ${sourcePage}` : null,
      `Saved at: ${subscriber?.created_at || new Date().toISOString()}`
    ].filter(Boolean);
    waitUntil(notifyTelegram(env, "Новая подписка на рассылку", lines.join("\n")).catch(() => {}));

    return json({
      ok: true,
      status: "subscribed",
      message: "Thanks for subscribing.",
      subscriber: {
        id: subscriber?.id,
        email,
        sourcePage: subscriber?.source_page ?? sourcePage ?? null,
        createdAt: subscriber?.created_at
      }
    });
  } catch (error) {
    console.error("[newsletter] subscribe failed", error);
    return json({ ok: false, error: "Failed to save newsletter signup." }, 500);
  }
}

export function onRequestGet() {
  return json({ ok: false, error: "Method Not Allowed" }, 405);
}
