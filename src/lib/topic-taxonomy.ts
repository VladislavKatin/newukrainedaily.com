import "server-only";

export const SUPPORTED_TOPICS = [
  "Ukraine",
  "Russia",
  "EU",
  "US",
  "NATO",
  "Economy",
  "Energy",
  "Security",
  "Diplomacy",
  "Humanitarian",
  "World"
] as const;

export type SupportedTopic = (typeof SUPPORTED_TOPICS)[number];

const TOPIC_KEYWORDS: Record<SupportedTopic, string[]> = {
  Ukraine: ["ukraine", "ukrainian", "kyiv", "kherson", "odesa", "kharkiv", "dnipro", "zaporizhzhia"],
  Russia: ["russia", "russian", "kremlin", "moscow"],
  EU: ["european union", "eu", "european commission", "brussels", "european council"],
  US: ["united states", "u.s.", "u.s", "washington", "white house", "state department", "pentagon"],
  NATO: ["nato", "alliance"],
  Economy: ["economy", "trade", "finance", "budget", "reconstruction", "investment", "bank"],
  Energy: ["energy", "power grid", "electricity", "gas", "oil", "nuclear"],
  Security: ["security", "defence", "defense", "military", "air defence", "air defense", "missile"],
  Diplomacy: ["diplomacy", "sanctions", "talks", "summit", "negotiation", "foreign minister"],
  Humanitarian: ["humanitarian", "aid", "health", "hospital", "displaced", "refugee", "civilian"],
  World: []
};

function normalizeText(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function uniqueNormalized(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function inferTopics(input: {
  title?: string | null;
  body?: string | null;
  tags?: string[];
  entities?: string[];
  primaryTopic?: string | null;
}) {
  const source = normalizeText(
    [input.primaryTopic, input.title, input.body, ...(input.tags || []), ...(input.entities || [])].join(" ")
  );

  const matchedTopics = SUPPORTED_TOPICS.filter((topic) => {
    const keywords = TOPIC_KEYWORDS[topic];
    return keywords.length > 0 && keywords.some((keyword) => source.includes(keyword));
  });

  const normalizedPrimary = SUPPORTED_TOPICS.find(
    (topic) => topic.toLowerCase() === normalizeText(input.primaryTopic)
  );
  const primaryTopic = normalizedPrimary || matchedTopics[0] || "World";
  const topics = uniqueNormalized([primaryTopic, ...matchedTopics]);

  return {
    primaryTopic,
    topics
  };
}

export function topicSlugFromLabel(topic: string) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "world";
}
