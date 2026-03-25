import type { ContentEntry, EntryType } from "@/lib/content-types";

type StoryFormat = "Breaking" | "Update" | "Report" | "Analysis" | "Explainer";

type StoryFormatConfig = {
  label: StoryFormat;
  sectionEyebrow: string;
  sidebarTitle: string;
  sidebarPoints: string[];
  newsletterTitle: string;
  newsletterDescription: string;
};

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

const EXPLAINER_PATTERNS = [/how /i, /why /i, /what /i, /guide/i, /explainer/i, /roadmap/i, /impact/i];

const STORY_FORMAT_CONFIG: Record<StoryFormat, StoryFormatConfig> = {
  Breaking: {
    label: "Breaking",
    sectionEyebrow: "Breaking news",
    sidebarTitle: "Breaking format",
    sidebarPoints: [
      "The lead carries the core fact first.",
      "Key figures and locations stay near the top.",
      "Related coverage tracks the same reporting line."
    ],
    newsletterTitle: "Get the next breaking Ukraine update",
    newsletterDescription: "Receive the fastest lead, key facts, and follow-up links in one concise newsroom note."
  },
  Update: {
    label: "Update",
    sectionEyebrow: "News update",
    sidebarTitle: "Update format",
    sidebarPoints: [
      "This template prioritizes developments over recap.",
      "Context stays short and tied to the current turn in the story.",
      "The page is designed for repeat readers checking what changed."
    ],
    newsletterTitle: "Get the next Ukraine update",
    newsletterDescription: "Track the latest policy, diplomacy, aid, and security changes without losing the thread."
  },
  Report: {
    label: "Report",
    sectionEyebrow: "News report",
    sidebarTitle: "Report format",
    sidebarPoints: [
      "Fast lead first, then fuller context.",
      "Source photo stays distinct from any illustration.",
      "Related coverage stays inside the same reporting thread."
    ],
    newsletterTitle: "Get the next major Ukraine report",
    newsletterDescription: "Follow the strongest verified developments with a cleaner newsroom brief and direct follow-up coverage."
  },
  Analysis: {
    label: "Analysis",
    sectionEyebrow: "Analysis",
    sidebarTitle: "Analysis standard",
    sidebarPoints: [
      "Analysis pages are meant to slow the story down.",
      "They connect current reporting to policy, reconstruction, aid, and long-term consequences.",
      "Context is included only when it sharpens the current angle."
    ],
    newsletterTitle: "Get the next newsroom analysis",
    newsletterDescription: "Receive deeper explainers on Ukraine, policy, recovery, and the choices shaping what comes next."
  },
  Explainer: {
    label: "Explainer",
    sectionEyebrow: "Explainer",
    sidebarTitle: "Explainer standard",
    sidebarPoints: [
      "Explainers answer the obvious reader questions first.",
      "Background is broken into shorter blocks for mobile reading.",
      "Links point to the most useful related coverage, not generic archives."
    ],
    newsletterTitle: "Get the next Ukraine explainer",
    newsletterDescription: "Receive concise explainers that turn complex Ukraine coverage into a clearer reading path."
  }
};

export function inferStoryFormat(entry: Pick<ContentEntry, "type" | "title" | "tags">): StoryFormat {
  if (entry.type === "blog") {
    return /analysis|commentary/i.test(entry.title) ? "Analysis" : "Explainer";
  }

  if (EXPLAINER_PATTERNS.some((pattern) => pattern.test(entry.title))) {
    return "Explainer";
  }

  if (BREAKING_PATTERNS.some((pattern) => pattern.test(entry.title))) {
    return "Breaking";
  }

  if (entry.tags.some((tag) => /diplomacy|security|energy|humanitarian|economy/i.test(tag))) {
    return "Update";
  }

  return "Report";
}

export function getStoryFormatConfig(entry: Pick<ContentEntry, "type" | "storyFormat"> | { type: EntryType; storyFormat?: string }): StoryFormatConfig {
  const fallback = entry.type === "blog" ? "Explainer" : "Report";
  const key = (entry.storyFormat as StoryFormat | undefined) ?? fallback;
  return STORY_FORMAT_CONFIG[key] ?? STORY_FORMAT_CONFIG[fallback];
}