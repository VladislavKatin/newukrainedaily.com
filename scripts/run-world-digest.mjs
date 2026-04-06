import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv(process.cwd());

async function main() {
  const digestDateArg = process.argv.slice(2).find((arg) => arg.startsWith("--date="));
  const digestDate = digestDateArg ? digestDateArg.slice("--date=".length) : undefined;
  const { generateWorldDigestForDate } = await import("../src/lib/world/digest");

  const result = await generateWorldDigestForDate(digestDate);
  console.log(JSON.stringify({ ok: true, result }, null, 2));
}

main().catch((error) => {
  console.error(`[world-digest] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
