import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
loadLocalEnv();

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function printSection(title) {
  console.log(`\n[${title}]`);
}

async function verifyDatabase() {
  const connectionString = readEnv("DATABASE_URL") || readEnv("SUPABASE_DATABASE_URL");

  printSection("database");

  if (!connectionString) {
    console.log("missing: DATABASE_URL or SUPABASE_DATABASE_URL");
    return false;
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 3000
  });

  try {
    const result = await pool.query("select now() as now");
    console.log(`ok: connected (${result.rows[0].now.toISOString()})`);
    return true;
  } catch (error) {
    console.log(`error: ${error.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function verifySupabaseStorage() {
  const supabaseUrl = readEnv("SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = readEnv("SUPABASE_STORAGE_BUCKET");

  printSection("supabase-storage");

  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    console.log("skip: set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET");
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 1
    });

    if (error) {
      console.log(`error: ${error.message}`);
      return false;
    }

    console.log(`ok: bucket reachable (${bucket}), sample objects=${data?.length ?? 0}`);
    const publicUrl = supabase.storage.from(bucket).getPublicUrl("generated/health-check.txt");
    console.log(`public url sample: ${publicUrl.data.publicUrl}`);
    return true;
  } catch (error) {
    console.log(`error: ${error.message}`);
    return false;
  }
}

function verifyLeonardoConfig() {
  printSection("leonardo");

  const apiKey = readEnv("LEONARDO_API_KEY");
  const webhookSecret = readEnv("LEONARDO_WEBHOOK_SECRET");
  const publicBaseUrl = readEnv("PUBLIC_BASE_URL");

  if (!apiKey || !webhookSecret || !publicBaseUrl) {
    console.log("missing: LEONARDO_API_KEY, LEONARDO_WEBHOOK_SECRET, PUBLIC_BASE_URL");
    return false;
  }

  console.log("ok: required Leonardo env vars are present");
  console.log(`webhook url: ${publicBaseUrl.replace(/\/$/, "")}/api/webhooks/leonardo`);
  console.log(
    "note: callback delivery must be configured on the Leonardo production API key."
  );
  return true;
}

function verifyCronSecret() {
  printSection("cron");

  const cronSecret = readEnv("CRON_SECRET");
  if (!cronSecret) {
    console.log("missing: CRON_SECRET");
    return false;
  }

  console.log("ok: CRON_SECRET is set");
  return true;
}

async function main() {
  console.log("verify-stack started");

  const results = [];
  results.push(verifyCronSecret());
  results.push(verifyLeonardoConfig());
  results.push(await verifyDatabase());
  results.push(await verifySupabaseStorage());

  const okCount = results.filter(Boolean).length;
  console.log(`\nsummary: ${okCount}/${results.length} checks passed`);

  if (okCount < 3) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
