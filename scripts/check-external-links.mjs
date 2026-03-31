import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [join(process.cwd(), "src", "app"), join(process.cwd(), "src", "components")];
const allowedFiles = new Set([
  join(process.cwd(), "src", "components", "external-link.tsx")
]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!Array.from(textExtensions).some((ext) => fullPath.endsWith(ext))) {
      continue;
    }
    if (allowedFiles.has(fullPath)) {
      continue;
    }
    checkFile(fullPath);
  }
}

function checkFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const rawAnchor = /<a\s[^>]*href=\"(?:https?:\/\/|mailto:)/.test(line);
    const rawDynamicAnchor = /<a\s[^>]*href=\{/.test(line);
    const rawExternalLink = /<Link\s[^>]*href=\"https?:\/\//.test(line);
    if (rawAnchor || rawDynamicAnchor || rawExternalLink) {
      violations.push(`${filePath}:${index + 1}: ${line.trim()}`);
    }
  });
}

for (const root of roots) {
  walk(root);
}

if (violations.length > 0) {
  console.error("Raw external anchors found. Use ExternalLink or copy-only UI instead:\n");
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log("No raw external anchors found in app/components.");
