import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;

loadLocalEnv(process.cwd());

for (const fileName of [".env.vercel.prod"]) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");

    process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 4
});

function normalize(value) {
  return String(value || "").trim();
}

function titleCase(value) {
  return normalize(value)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function descriptionForTag(tag, title) {
  const label = titleCase(title || tag);
  const key = normalize(tag).toLowerCase();

  const rules = [
    { test: /(ukraine|ukrainian|kyiv|kharkiv|kherson|dnipro|donetsk|luhansk|crimea|zaporizh)/, text: `${label} coverage, reporting, and context related to Ukraine's war, politics, or recovery.` },
    { test: /(aid|donat|civil-society|humanitarian|relief|support)/, text: `${label} coverage focused on aid delivery, donor strategy, civil society, and practical support for Ukraine.` },
    { test: /(energy|power|grid|infrastructure)/, text: `${label} reporting on energy resilience, infrastructure protection, and Ukraine's recovery challenges.` },
    { test: /(diplomacy|negotiat|sanction|eu|nato|trump|orban|russia|kremlin|foreign|coordination)/, text: `${label} coverage tracking diplomacy, negotiations, international pressure, and political decision-making.` },
    { test: /(military|defense|front|drone|missile|air defense|security|conflict|civilian casualties|civilian safety|airport safety)/, text: `${label} reporting on security developments, attacks, military pressure, and civilian risk.` },
    { test: /(captivity|pow|displacement|refugee|idp|family|children|school|medical|hospital|trauma)/, text: `${label} coverage focused on the civilian and humanitarian impact of war, displacement, and recovery.` }
  ];

  for (const rule of rules) {
    if (rule.test.test(key)) {
      return rule.text;
    }
  }

  return `${label} coverage, background, and related reporting from New Ukraine Daily.`;
}

async function main() {
  try {
    const { rows } = await pool.query(`select id, tag, title, description from topics order by updated_at desc nulls last, tag asc`);
    let updated = 0;

    for (const row of rows) {
      const nextTitle = titleCase(row.title || row.tag);
      const nextDescription = descriptionForTag(row.tag, nextTitle);

      if (normalize(row.title) === nextTitle && normalize(row.description) === nextDescription) {
        continue;
      }

      await pool.query(
        `
          update topics
          set title = $2,
              description = $3,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [row.id, nextTitle, nextDescription]
      );
      updated += 1;
    }

    console.log(`[refresh-topic-descriptions] updated=${updated}/${rows.length}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[refresh-topic-descriptions] failed:", error);
  process.exitCode = 1;
});
