import type { WorldDigestItemRecord } from "@/lib/world-repository";

type WorldVisualTopic = "conflict" | "diplomacy" | "economy" | "energy" | "politics" | "shipping";

type WorldDigestVisual = {
  imageUrl: string;
  imageAlt: string;
  topicLabel: string;
};

const FALLBACKS: Record<WorldVisualTopic, { imageUrl: string; topicLabel: string }> = {
  conflict: { imageUrl: "/world-thumb-conflict.svg", topicLabel: "Conflict" },
  diplomacy: { imageUrl: "/world-thumb-diplomacy.svg", topicLabel: "Diplomacy" },
  economy: { imageUrl: "/world-thumb-economy.svg", topicLabel: "Economy" },
  energy: { imageUrl: "/world-thumb-energy.svg", topicLabel: "Energy" },
  politics: { imageUrl: "/world-thumb-politics.svg", topicLabel: "Politics" },
  shipping: { imageUrl: "/world-thumb-shipping.svg", topicLabel: "Shipping" }
};

function isGenericWorldFeedImage(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return true;
  }

  try {
    const hostname = new URL(imageUrl).hostname.toLowerCase();
    return hostname.includes("googleusercontent.com") || hostname.includes("gstatic.com") || hostname.includes("news.google.com");
  } catch {
    return false;
  }
}

function classifyWorldTopic(text: string): WorldVisualTopic {
  const value = text.toLowerCase();

  if (/hormuz|strait|ship|shipping|maritime|naval|port/.test(value)) {
    return "shipping";
  }

  if (/oil|gas|energy|power|electricity|pipeline/.test(value)) {
    return "energy";
  }

  if (/market|trade|econom|inflation|tariff|debt|stocks|bank/.test(value)) {
    return "economy";
  }

  if (/summit|talks|ceasefire|diplom|negotiat|peace|allies|partners/.test(value)) {
    return "diplomacy";
  }

  if (/election|parliament|president|prime minister|government|pope|cabinet/.test(value)) {
    return "politics";
  }

  return "conflict";
}

export function getWorldDigestVisual(item: Pick<WorldDigestItemRecord, "title" | "summary" | "imageUrl" | "imageAlt">): WorldDigestVisual {
  const topic = classifyWorldTopic(`${item.title} ${item.summary}`);
  const fallback = FALLBACKS[topic];

  if (!isGenericWorldFeedImage(item.imageUrl)) {
    return {
      imageUrl: item.imageUrl || fallback.imageUrl,
      imageAlt: item.imageAlt || item.title,
      topicLabel: fallback.topicLabel
    };
  }

  return {
    imageUrl: fallback.imageUrl,
    imageAlt: item.imageAlt || `${item.title} illustration`,
    topicLabel: fallback.topicLabel
  };
}
