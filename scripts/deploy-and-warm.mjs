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

async function notifyTelegram(status, title, text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    await runStep("Telegram Notification", `_internal:telegram:${status}`);
  } catch {
    try {
      const child = spawn("cmd.exe", [
        "/c",
        "node",
        "scripts/telegram-notify.mjs",
        `--status=${status}`,
        `--title=${title}`,
        `--text=${text}`
      ], {
        stdio: "inherit",
        shell: false,
        env: process.env
      });

      await new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`telegram notify failed with ${code}`))));
      });
    } catch (error) {
      process.stderr.write(`
Telegram notification failed: ${error instanceof Error ? error.message : String(error)}
`);
    }
  }
}

(async () => {
  const startedAt = Date.now();

  try {
    await runStep("Production Deploy", "_internal:vercel:deploy");
    await runStep("Production Warm-Up", "warm:production");
    await runStep("Production Health Check", "check:production-health");

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    const text = `Production deploy, warm-up, and health check passed in ${durationSeconds}s.`;
    await notifyTelegram("success", "Production release completed", text);
    process.stdout.write(`
${text}
`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await notifyTelegram("error", "Production release failed", message);
    process.stderr.write(`
Production deploy and warm-up failed: ${message}
`);
    process.exitCode = 1;
  }
})();
