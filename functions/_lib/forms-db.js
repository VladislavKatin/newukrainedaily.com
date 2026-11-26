// Form submissions are stored in Cloudflare D1 (binding "DB" on the Pages project).
// Supabase's HTTP API is not used here: the project is restricted on the free plan.
let schemaReady = false;

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        source_page TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )`
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS audience_poll_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_key TEXT NOT NULL,
        answer TEXT NOT NULL,
        source_page TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )`
    )
  ]);
  schemaReady = true;
}

export function hasFormsDb(env) {
  return Boolean(env.DB && typeof env.DB.prepare === "function");
}

export async function saveSubscriber(env, { email, name, sourcePage }) {
  await ensureSchema(env.DB);
  return env.DB.prepare(
    `INSERT INTO newsletter_subscribers (email, name, source_page, status)
     VALUES (?1, ?2, ?3, 'active')
     ON CONFLICT(email) DO UPDATE SET
       name = COALESCE(excluded.name, newsletter_subscribers.name),
       source_page = COALESCE(excluded.source_page, newsletter_subscribers.source_page),
       status = 'active',
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     RETURNING id, email, source_page, created_at`
  )
    .bind(email, name ?? null, sourcePage ?? null)
    .first();
}

export async function savePollVote(env, { pollKey, answer, sourcePage, userAgent }) {
  await ensureSchema(env.DB);
  return env.DB.prepare(
    `INSERT INTO audience_poll_responses (poll_key, answer, source_page, user_agent)
     VALUES (?1, ?2, ?3, ?4)
     RETURNING id, created_at`
  )
    .bind(pollKey, answer, sourcePage ?? null, userAgent ?? null)
    .first();
}
