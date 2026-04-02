import { spawn } from "node:child_process";

function runStep(label, script) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`
=== ${label} ===
`);

    const child = spawn("cmd.exe", ["/c", "npm.cmd", "run", script], {
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
    await runStep("Production Deploy", "_internal:vercel:deploy");
    await runStep("Production Warm-Up", "warm:production");
    await runStep("Production Health Check", "check:production-health");

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
