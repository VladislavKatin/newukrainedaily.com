import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const localHost = "127.0.0.1";

function runStep(step, extraArgs = [], extraEnv = {}) {
  return new Promise((resolve, reject) => {
    process.stdout.write(`\n=== ${step.label} ===\n`);

    const child = spawn("cmd.exe", ["/c", "npm.cmd", "run", step.script, ...extraArgs], {
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        ...extraEnv
      }
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

function findFreePort(startPort = 3000, maxAttempts = 25) {
  return new Promise((resolve, reject) => {
    let port = startPort;

    const tryPort = () => {
      if (port >= startPort + maxAttempts) {
        reject(new Error(`Unable to find a free port starting from ${startPort}`));
        return;
      }

      const server = net.createServer();

      server.once("error", () => {
        port += 1;
        tryPort();
      });

      server.listen({ host: localHost, port }, () => {
        const address = server.address();
        const resolvedPort = typeof address === "object" && address ? address.port : null;

        server.close(() => {
          if (!resolvedPort) {
            reject(new Error("Unable to resolve a free port for release check"));
            return;
          }

          resolve(resolvedPort);
        });
      });
    };

    tryPort();
  });
}

function waitForUrl(url, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // keep retrying until timeout
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(tick, 1000);
    };

    void tick();
  });
}

async function withLocalServer(run) {
  const port = await findFreePort();
  const baseUrl = `http://${localHost}:${port}`;
  const output = [];

  const child = spawn("cmd.exe", [
    "/c",
    "npm.cmd",
    "run",
    "start",
    "--",
    "-H",
    localHost,
    "-p",
    String(port)
  ], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: {
      ...process.env
    }
  });

  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    output.push(text);
    process.stdout.write(text);
  });

  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    output.push(text);
    process.stderr.write(text);
  });

  try {
    await waitForUrl(`${baseUrl}/`);
    await run(baseUrl);
  } catch (error) {
    process.stderr.write(`\nLocal preview logs:\n${output.join("").trim()}\n`);
    throw error;
  } finally {
    if (child.pid) {
      spawnSync("cmd.exe", ["/c", "taskkill", "/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        shell: false
      });
    }
  }
}

(async () => {
  const steps = [
    { label: "Lint", script: "lint" },
    { label: "Build", script: "build" }
  ];

  const startedAt = Date.now();

  try {
    for (const step of steps) {
      await runStep(step);
    }

    await withLocalServer(async (baseUrl) => {
      await runStep(
        { label: "Frontend Smoke", script: "test:frontend" },
        ["--", "--project=chromium-desktop", "--project=webkit-mobile"],
        { SMOKE_BASE_URL: baseUrl }
      );

      await runStep(
        { label: "Frontend Visual", script: "test:frontend:visual" },
        ["--", "--project=chromium-desktop", "--project=webkit-mobile"],
        { SMOKE_BASE_URL: baseUrl }
      );
    });

    const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
    process.stdout.write(`\nRelease check passed in ${durationSeconds}s.\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\nRelease check failed: ${message}\n`);
    process.exitCode = 1;
  }
})();
