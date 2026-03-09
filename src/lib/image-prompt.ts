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

  if (
    /\b(housing|residential|substation|power|energy|grid|hospital|school|bridge|rail|railway|port|shelter|blackout|reconstruction|infrastructure)\b/.test(
      seed
    )
  ) {
    return "infrastructure";
  }

  if (
    /\b(president|minister|ministry|government|parliament|summit|talks|negotiation|ceasefire|aid package|sanctions|meeting|delegation|officials)\b/.test(
      seed
    )
  ) {
    return "institutional";
  }

  if (
    /\b(drone|missile|strike|shelling|attack|air defense|emergency crews|firefighters|debris|overnight attack|frontline)\b/.test(
      seed
    )
  ) {
    return "urban-aftermath";
  }

  return "symbolic-factual";
}

function buildSceneDirection(sceneType: SceneType, location: string | null | undefined) {
  const locationText = normalizeText(location);
  const locationSuffix = locationText ? ` in ${locationText}` : "";

  switch (sceneType) {
    case "infrastructure":
      return `Show civic or infrastructure context${locationSuffix}, such as housing, energy, transport, or public-service facilities supported by the report.`;
    case "institutional":
      return `Show an institutional setting${locationSuffix}, such as a government room, diplomatic venue, or official briefing environment connected to the reported decision.`;
    case "urban-aftermath":
      return `Show the aftermath of a reported attack${locationSuffix}, with emergency response, damaged urban surroundings, or defensive infrastructure, without sensational destruction.`;
    default:
      return `Show a factual symbolic setting${locationSuffix} tied to the reported development, using civic, diplomatic, or security context rather than dramatic poster imagery.`;
  }
}

function buildFactLines(input: NewsImagePromptInput) {
  const facts = [
    ...splitSentences(sanitizeForVisualPrompt(input.lead)),
    ...splitSentences(sanitizeForVisualPrompt(input.body)).slice(0, 1),
    ...splitSentences(sanitizeForVisualPrompt(input.whyItMatters)).slice(0, 1)
  ];

  return Array.from(new Set(facts.map((fact) => clamp(fact, 200)))).slice(0, 3);
}

export function buildNewsImagePromptPackage(input: NewsImagePromptInput): NewsImagePromptPackage {
  const title = clamp(input.title, 120);
  const lead = clamp(sanitizeForVisualPrompt(input.lead), 180);
  const tags = (input.tags || []).map((tag) => sanitizeForVisualPrompt(tag)).filter(Boolean).slice(0, 6);
  const factLines = buildFactLines(input);
  const sceneType = classifySceneType([title, lead, ...factLines].join(" "), tags);
  const sceneDirection = buildSceneDirection(sceneType, input.location);
  const sourceName = sanitizeForVisualPrompt(input.sourceName);

  const prompt = clamp([
    "Create a realistic editorial illustration for a Ukraine news report.",
    `Reported angle: ${title}.`,
    lead ? `Lead facts: ${lead}.` : null,
    factLines.length > 0 ? `Key reported details: ${factLines.join(" ")}` : null,
    tags.length > 0 ? `Themes: ${tags.join(", ")}.` : null,
    sourceName ? `Source context: ${sourceName}.` : null,
    sceneDirection,
    "Use muted colors, clear composition, serious newsroom tone, and realistic editorial illustration style.",
    "This must look like an illustration for a news report, not a documentary photo.",
    "No text, no logos, no watermark, no propaganda poster style, no fantasy, no gore, no cinematic fire or explosions unless the reported facts clearly require visible damage."
  ]
    .filter(Boolean)
    .join(" "), 1200);

  const altSeed = lead || factLines[0] || title;

  return {
    prompt,
    alt: clamp(`AI illustration of ${altSeed}`.replace(/^AI illustration of AI illustration/i, "AI illustration of"), 140),
    caption: "Illustration for this report. Created by the editorial desk using AI.",
    sceneType
  };
}
