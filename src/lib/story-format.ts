import type { ContentEntry } from "@/lib/content-types";

const BREAKING_PATTERNS = [
  /latest/i,
  /overnight/i,
  /attack/i,
  /strike/i,
  /launches/i,
  /intercepts/i,
  /says/i,
  /reports/i,
  /announces/i
];

const EXPLAINER_PATTERNS = [
  /how /i,
  /why /i,
  /what /i,
  /guide/i,
  /explainer/i,
  /roadmap/i,
  /impact/i
];

export function inferStoryFormat(entry: Pick<ContentEntry, "type" | "title" | "tags">) {
  if (entry.type === "blog") {
    return /analysis|explainer|guide|roadmap|impact/i.test(entry.title)
      ? "Explainer"
      : "Analysis";
  }

  if (EXPLAINER_PATTERNS.some((pattern) => pattern.test(entry.title))) {
    return "Explainer";
  }

  if (BREAKING_PATTERNS.some((pattern) => pattern.test(entry.title))) {
    return "Breaking";
  }

  if (entry.tags.some((tag) => /diplomacy|security|energy|humanitarian/i.test(tag))) {
    return "Update";
  }

  return "Report";
}
