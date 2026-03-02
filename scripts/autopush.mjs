import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const debounceMs = Number(process.env.AUTOPUSH_DEBOUNCE_MS || "4000");
const ignoredSegments = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "dist",
  ".idea",
  "supabase/.temp"
]);

let flushTimer = null;
let flushInProgress = false;
let rerunRequested = false;

function hasIgnoredSegment(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  for (const ignored of ignoredSegments) {
    if (normalized === ignored || normalized.startsWith(`${ignored}/`) || normalized.includes(`/${ignored}/`)) {
      return true;
    }
  }

  return false;
}

function runGit(args, options = {}) {
  const result = spawnSync("git", ["-c", "safe.directory=C:/www/ukranian", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options
  });

  return result;
}

function runNpm(args, options = {}) {
  const result = spawnSync("npm.cmd", args, {
    cwd: repoRoot,
    encoding: "utf8",
    ...options
  });

  return result;
}

function printResult(prefix, result) {
  if (result.stdout?.trim()) {
    console.log(`${prefix}${result.stdout.trim()}`);
  }

  if (result.stderr?.trim()) {
    console.error(`${prefix}${result.stderr.trim()}`);
  }
}

function getStatusPorcelain() {
  const result = runGit(["status", "--porcelain"]);

  if (result.status !== 0) {
    printResult("[autopush] ", result);
    throw new Error("git status failed");
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function buildCommitMessage() {
  return `autosync: ${new Date().toISOString()}`;
}

function flushChanges() {
  if (flushInProgress) {
    rerunRequested = true;
    return;
  }

  flushInProgress = true;

  try {
    const statusBefore = getStatusPorcelain();

    if (statusBefore.length === 0) {
      return;
    }

    const addResult = runGit(["add", "-A"]);
    if (addResult.status !== 0) {
      printResult("[autopush] ", addResult);
      throw new Error("git add failed");
    }

    const statusAfterAdd = getStatusPorcelain();
    if (statusAfterAdd.length === 0) {
      return;
    }

    const lintResult = runNpm(["run", "lint"]);
    if (lintResult.status !== 0) {
      printResult("[autopush] ", lintResult);
      throw new Error("lint failed, autosync aborted");
    }

    printResult("[autopush] ", lintResult);

    const commitMessage = buildCommitMessage();
    const commitResult = runGit(["commit", "-m", commitMessage]);

    if (commitResult.status !== 0) {
      printResult("[autopush] ", commitResult);

      if (commitResult.stdout?.includes("nothing to commit") || commitResult.stderr?.includes("nothing to commit")) {
        return;
      }

      throw new Error("git commit failed");
    }

    printResult("[autopush] ", commitResult);

    const pushResult = runGit(["push", "-u", "origin", "main"]);
    if (pushResult.status !== 0) {
      printResult("[autopush] ", pushResult);
      throw new Error("git push failed");
    }

    printResult("[autopush] ", pushResult);
  } finally {
    flushInProgress = false;

    if (rerunRequested) {
      rerunRequested = false;
      scheduleFlush("rerun");
    }
  }
}

function scheduleFlush(reason) {
  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  console.log(`[autopush] change detected (${reason}), syncing in ${debounceMs}ms`);

  flushTimer = setTimeout(() => {
    flushTimer = null;

    try {
      flushChanges();
    } catch (error) {
      console.error(
        `[autopush] ${error instanceof Error ? error.message : "Unknown autosync error"}`
      );
    }
  }, debounceMs);
}

function startWatcher() {
  console.log(`[autopush] watching ${repoRoot}`);
  console.log(`[autopush] debounce=${debounceMs}ms`);
  console.log("[autopush] stop with Ctrl+C");

  fs.watch(
    repoRoot,
    {
      recursive: true
    },
    (eventType, filename) => {
      if (!filename) {
        scheduleFlush(eventType);
        return;
      }

      const normalized = filename.replace(/\\/g, "/");

      if (hasIgnoredSegment(normalized)) {
        return;
      }

      const fullPath = path.join(repoRoot, filename);

      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return;
      }

      scheduleFlush(`${eventType}:${normalized}`);
    }
  );
}

startWatcher();
