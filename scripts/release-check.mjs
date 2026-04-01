import { spawn } from "node:child_process";

const steps = [
  { label: "Lint", script: "lint" },
  { label: "Build", script: "build" },
  { label: "Frontend Smoke", script: "test:frontend" },
  { label: "Frontend Visual", script: "test:frontend:visual" }
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`\n=== ${step.label} ===\n`);

    const child = spawn("cmd.exe", ["/c", "npm.cmd", "run", step.script], {
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
      reject(new Error(`${step.label} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

(async () => {
  const startedAt = Date.now();

  try {
    for (const step of steps) {
      await runStep(step);
    }

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    process.stdout.write(`\nRelease check passed in ${durationSeconds}s.\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\nRelease check failed: ${message}\n`);
    process.exitCode = 1;
  }
})();
