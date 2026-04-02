import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npxBin = isWindows ? "npx.cmd" : "npx";
const npmBin = isWindows ? "npm.cmd" : "npm";

function runStep(label, command, args) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`
=== ${label} ===
`);

    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      env: process.env
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

(async () => {
  const startedAt = Date.now();

  try {
    await runStep("Production Deploy", npxBin, ["vercel", "deploy", "--prod", "--yes"]);
    await runStep("Production Warm-Up", npmBin, ["run", "warm:production"]);
    await runStep("Production Health Check", npmBin, ["run", "check:production-health"]);

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    process.stdout.write(`
Production deploy and warm-up completed in ${durationSeconds}s.
`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`
Production deploy and warm-up failed: ${message}
`);
    process.exitCode = 1;
  }
})();
