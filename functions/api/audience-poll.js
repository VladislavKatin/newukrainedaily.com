import { cleanString, json, readJson, supabaseInsert } from "../_lib/shared.js";
import { hasFormsDb, savePollVote } from "../_lib/forms-db.js";

const ALLOWED_ANSWERS = new Set(["singapore", "china"]);

export async function onRequestPost({ request, env }) {
  const payload = await readJson(request);

  if (!payload || typeof payload !== "object") {
    return json({ ok: false, error: "Invalid poll vote." }, 400);
  }

  if (cleanString(payload.website, 200)) {
    return json({ ok: true, status: "ignored" });
  }

  const pollKey = cleanString(payload.pollKey, 120);
  const answer = cleanString(payload.answer, 40);
  const sourcePage = cleanString(payload.sourcePage, 240);

  if (!pollKey || pollKey.length < 3 || !answer || !ALLOWED_ANSWERS.has(answer)) {
    return json({ ok: false, error: "Invalid poll vote." }, 400);
  }

  try {
    const userAgent = (request.headers.get("user-agent") || "").slice(0, 500) || null;
    const vote = hasFormsDb(env)
      ? await savePollVote(env, { pollKey, answer, sourcePage, userAgent })
      : await supabaseInsert(env, "audience_poll_responses", {
          poll_key: pollKey,
          answer,
          source_page: sourcePage ?? null,
          user_agent: userAgent
        });

    return json({
      ok: true,
      status: "saved",
      message: "Thanks for voting.",
      vote: { id: vote?.id, answer, createdAt: vote?.created_at }
    });
  } catch (error) {
    console.error("[audience-poll] vote failed", error);
    return json({ ok: false, error: "Failed to save your vote." }, 500);
  }
}

export function onRequestGet() {
  return json({ ok: false, error: "Method Not Allowed" }, 405);
}
