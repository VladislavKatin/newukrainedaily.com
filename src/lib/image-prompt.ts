function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function clamp(value: string, max: number) {
  const normalized = normalizeText(value);
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function splitSentences(value: string) {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sanitizeForVisualPrompt(value: string | null | undefined) {
  return normalizeText(value)
    .replace(/\b(sexual violence|rape|torture|massacre|gore|blood|execution)\b/gi, "human rights abuse")
    .replace(/\b(killed|dead)\b/gi, "casualties reported")
    .replace(/\b(explosion|explosions)\b/gi, "damage aftermath")
    .trim();
}

type SceneType = "infrastructure" | "institutional" | "urban-aftermath" | "symbolic-factual";

type NewsImagePromptInput = {
  title: string;
  lead?: string | null;
  body?: string | null;
  whyItMatters?: string | null;
  tags?: string[];
  sourceName?: string | null;
  location?: string | null;
};

export type NewsImagePromptPackage = {
  prompt: string;
  alt: string;
  caption: string;
  sceneType: SceneType;
};

function classifySceneType(text: string, tags: string[]) {
  const seed = `${text} ${tags.join(" ")}`.toLowerCase();

  if (/\b(housing|residential|substation|power|energy|grid|hospital|school|bridge|rail|railway|port|shelter|blackout|reconstruction|infrastructure)\b/.test(seed)) {
    return "infrastructure";
  }

  if (/\b(president|minister|ministry|government|parliament|summit|talks|negotiation|ceasefire|aid package|sanctions|meeting|delegation|officials)\b/.test(seed)) {
    return "institutional";
  }

  if (/\b(drone|missile|strike|shelling|attack|air defense|emergency crews|firefighters|debris|overnight attack|frontline)\b/.test(seed)) {
    return "urban-aftermath";
  }

  return "symbolic-factual";
}

function buildSceneDirection(sceneType: SceneType, location: string | null | undefined) {
  const locationText = normalizeText(location);
  const locationSuffix = locationText ? ` in ${locationText}` : "";

  switch (sceneType) {
    case "infrastructure":
      return `Editorial illustration of infrastructure or public-service context${locationSuffix}.`;
    case "institutional":
      return `Editorial illustration of an official or diplomatic setting${locationSuffix}.`;
    case "urban-aftermath":
      return `Editorial illustration of the aftermath of a reported attack${locationSuffix}, without sensational destruction.`;
    default:
      return `Editorial illustration of a factual civic or diplomatic context${locationSuffix}.`;
  }
}

function buildFactLine(input: NewsImagePromptInput) {
  const facts = [
    ...splitSentences(sanitizeForVisualPrompt(input.lead)),
    ...splitSentences(sanitizeForVisualPrompt(input.body)).slice(0, 1),
    ...splitSentences(sanitizeForVisualPrompt(input.whyItMatters)).slice(0, 1)
  ];

  return clamp(Array.from(new Set(facts)).join(" "), 180);
}

export function buildNewsImagePromptPackage(input: NewsImagePromptInput): NewsImagePromptPackage {
  const title = clamp(input.title, 100);
  const tags = (input.tags || []).map((tag) => sanitizeForVisualPrompt(tag)).filter(Boolean).slice(0, 3);
  const factLine = buildFactLine(input);
  const sceneType = classifySceneType([title, factLine].join(" "), tags);
  const sceneDirection = buildSceneDirection(sceneType, input.location);

    const prompt = clamp([
    sceneDirection,
    tags.length > 0 ? tags.slice(0, 2).join(', ') : null,
    "Muted colors, editorial illustration, no text."
  ].filter(Boolean).join(" "), 140);

  const altSeed = clamp(sanitizeForVisualPrompt(input.lead) || title, 110);

  return {
    prompt,
    alt: clamp(`AI illustration of ${altSeed}`.replace(/^AI illustration of AI illustration/i, "AI illustration of"), 140),
    caption: "Illustration for this report. Created by the editorial desk using AI.",
    sceneType
  };
}
