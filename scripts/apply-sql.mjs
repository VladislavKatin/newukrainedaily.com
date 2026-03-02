import fs from "node:fs/promises";
import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
loadLocalEnv();

function readDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
  }

  return url;
}

async function main() {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    throw new Error("Pass at least one SQL file path.");
  }

  const pool = new Pool({
    connectionString: readDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();

    try {
      for (const file of files) {
        const sql = await fs.readFile(file, "utf8");
        console.log(`[apply-sql] applying ${file}`);
        await client.query(sql);
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  console.log("[apply-sql] completed");
}

main().catch((error) => {
  console.error(`[apply-sql] ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
