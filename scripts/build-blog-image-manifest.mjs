import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { XMLParser } from "fast-xml-parser";

const FEED_URL = process.env.BLOG_FEED_URL || "https://www.newukrainedaily.com/blog/feed.xml";
const OUTPUT_PATH = path.join(process.cwd(), "scripts", "output", "blog-image-manifest.json");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function clamp(value, max) {
  const normalized = normalizeText(value);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function extractSlug(url) {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "");
    return pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}

const rules = [
  {
    match: /hospital|medical|clinic/i,
    brief: "Real hospital corridor or treatment room in Ukraine with working staff, equipment, and a calm documentary tone.",
    prompt: "Documentary-style editorial photo of Ukrainian hospital staff working in a real corridor or treatment area, practical medical setting, visible equipment and hospital light, natural color, realistic details, serious tone, no staged charity smiles, no text, no watermark.",
    alt: "Medical staff working inside a Ukrainian hospital corridor"
  },
  {
    match: /school|education/i,
    brief: "Real classroom in Ukraine with students and teacher, resilient everyday learning, natural light, no posed stock-photo feel.",
    prompt: "Documentary-style editorial photo of a classroom in Ukraine, teacher and students during a real lesson, resilient everyday school setting, natural light, realistic details, serious but hopeful tone, no staged pose, no text, no watermark.",
    alt: "Students and a teacher in a Ukrainian classroom"
  },
  {
    match: /energy|power|grid|electric|outage/i,
    brief: "Real energy infrastructure or repair crew in Ukraine, substation, cables, tools, or field engineers at work.",
    prompt: "Documentary-style editorial photo of Ukrainian energy workers repairing infrastructure, substation or grid equipment, tools, protective gear, realistic industrial setting, muted colors, serious newsroom tone, no text, no watermark.",
    alt: "Ukrainian energy workers repairing power infrastructure"
  },
  {
    match: /winter|displacement|families/i,
    brief: "Ukrainian family receiving seasonal or humanitarian support in cold weather, natural, respectful, non-staged scene.",
    prompt: "Documentary-style editorial photo of a Ukrainian family receiving winter or humanitarian support, coats, blankets or aid packages visible, cold-weather setting, respectful realistic composition, natural light, no text, no watermark.",
    alt: "A Ukrainian family receiving humanitarian support in winter"
  },
  {
    match: /small-business|business/i,
    brief: "Owner or staff working inside a real Ukrainian small business, shop, workshop, bakery, or office.",
    prompt: "Documentary-style editorial photo of a Ukrainian small business owner or staff at work in a shop, bakery, workshop, or office, realistic business environment, natural light, serious tone, no text, no watermark.",
    alt: "A small business owner working inside a Ukrainian shop or workshop"
  },
  {
    match: /transparent|reporting|metrics|trustworthy|choose/i,
    brief: "Coordinator or analyst reviewing aid reports, laptop, paperwork, spreadsheet printouts, practical accountability setting.",
    prompt: "Documentary-style editorial photo of an aid coordinator or analyst reviewing reports on a laptop with documents and notes on a desk, accountability and transparency setting, realistic office scene, muted colors, no text, no watermark.",
    alt: "An aid coordinator reviewing reports and documents on a laptop"
  },
  {
    match: /local-partnership|partnership|community-resilience|civil-society|reconstruction/i,
    brief: "Community meeting, local coordination, or hands-on reconstruction work in a Ukrainian town or neighborhood.",
    prompt: "Documentary-style editorial photo of local partners coordinating community recovery in Ukraine, meeting at a site or working on reconstruction, realistic neighborhood setting, serious civic tone, no staged gestures, no text, no watermark.",
    alt: "Local partners coordinating recovery work in a Ukrainian community"
  },
  {
    match: /donation|donors|support|solidarity|initiative|aid/i,
    brief: "Humanitarian logistics or donation workflow, volunteers, aid boxes, warehouse or community support center, practical and real.",
    prompt: "Documentary-style editorial photo of volunteers handling humanitarian aid in Ukraine, warehouse or support center, boxes, lists, logistics workflow, realistic newsroom tone, natural light, no text, no watermark.",
    alt: "Volunteers sorting humanitarian aid inside a support center"
  }
];

function buildRecommendation(item) {
  const seed = `${item.title} ${item.slug}`;
  const matched = rules.find((rule) => rule.match.test(seed)) || {
    brief: "Real-life Ukrainian civic or humanitarian setting tied to the article topic, documentary, calm, and concrete.",
    prompt: "Documentary-style editorial photo connected to Ukraine support and recovery, real civic or humanitarian setting, natural light, realistic details, serious tone, no staged stock-photo look, no text, no watermark.",
    alt: `Editorial photo related to ${clamp(item.title, 90)}`
  };

  return {
    imageType: "real-photo",
    visualBrief: matched.brief,
    prompt: matched.prompt,
    alt: clamp(matched.alt, 140),
    caption: "Photo: Editorial reference"
  };
}

async function main() {
  const response = await fetch(FEED_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load blog feed: ${response.status}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  const manifest = list.map((item, index) => {
    const title = normalizeText(item.title);
    const articleUrl = normalizeText(item.link);
    const slug = extractSlug(articleUrl);
    const recommendation = buildRecommendation({ title, slug });

    return {
      order: index + 1,
      slug,
      title,
      articleUrl,
      ...recommendation,
      imageUrl: ""
    };
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFeed: FEED_URL,
        count: manifest.length,
        items: manifest
      },
      null,
      2
    ) + "\n"
  );

  console.log(`[blog-image-manifest] wrote ${manifest.length} items to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("[blog-image-manifest] failed:", error);
  process.exitCode = 1;
});
