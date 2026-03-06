import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;

loadLocalEnv(process.cwd());

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1/generations";
const LEONARDO_MODEL_ID = "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
}
if (!LEONARDO_API_KEY) {
  throw new Error("LEONARDO_API_KEY is required.");
}

const POSTS = [
  {
    slug: "how-global-support-helps-ukrainian-families-rebuild-daily-life",
    title: "How Global Support Helps Ukrainian Families Rebuild Daily Life",
    tags: ["ukraine-support", "humanitarian", "families", "donations"]
  },
  {
    slug: "why-consistent-donations-to-ukraine-create-real-impact",
    title: "Why Consistent Donations to Ukraine Create Real Impact",
    tags: ["donate-ukraine", "support", "funding", "impact"]
  },
  {
    slug: "ukrainian-community-resilience-and-what-donors-should-know",
    title: "Ukrainian Community Resilience and What Donors Should Know",
    tags: ["civil-society", "ukraine-support", "recovery"]
  },
  {
    slug: "supporting-ukraines-energy-stability-through-targeted-aid",
    title: "Supporting Ukraine's Energy Stability Through Targeted Aid",
    tags: ["energy-resilience", "donate-ukraine", "humanitarian"]
  },
  {
    slug: "how-to-choose-trustworthy-ukraine-support-initiatives",
    title: "How to Choose Trustworthy Ukraine Support Initiatives",
    tags: ["donate-ukraine", "transparency", "ukraine-support"]
  },
  {
    slug: "from-solidarity-to-results-a-practical-guide-to-helping-ukraine",
    title: "From Solidarity to Results: A Practical Guide to Helping Ukraine",
    tags: ["ukraine-support", "donations", "long-term-support"]
  }
];

function clamp(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(1, max - 1)).trim()}…`;
}

function buildBody(title) {
  const body = [
    "## Introduction",
    `${title} reflects a clear reality: practical support matters most when it is sustained, transparent, and connected to specific needs. Public attention often rises during breaking events, but real progress for Ukrainian communities depends on continuity over months, not isolated moments.`,
    "For readers who want to help responsibly, the core challenge is moving from emotion to structure. Structure means setting goals, choosing reliable channels, and reviewing outcomes regularly.",
    "",
    "## What Effective Support Looks Like",
    "Effective support combines three tracks at once. First, urgent humanitarian help for immediate safety and medical access. Second, service continuity for schools, clinics, and local infrastructure. Third, local recovery that helps neighborhoods regain stability and economic activity.",
    "When these tracks are balanced, support becomes more resilient. If one area slows, another can still deliver meaningful benefit. This is especially important in prolonged pressure environments where conditions can shift quickly.",
    "",
    "## Why Donor Consistency Matters",
    "Recurring support creates predictability, and predictability improves operational quality. Organizations can plan procurement better, avoid emergency overpaying, and keep skilled teams active in the field. In practical terms, consistency often increases impact more than sporadic high-volume transfers.",
    "A disciplined monthly approach also improves accountability for donors. It makes it easier to compare updates, track execution, and adjust contributions when priorities change.",
    "",
    "## Ukrainian Context and Community Gratitude",
    "Across Ukrainian communities, support is usually interpreted not only as financial assistance but also as a sign of long-term solidarity. Public gratitude is visible in how local groups document deliveries, acknowledge partner help, and share outcomes with specific detail.",
    "This matters because trust is cumulative. When supporters see honest reporting and communities see predictable help, both sides are more likely to stay engaged.",
    "",
    "## Editorial Insight",
    "A strong support strategy is rarely dramatic. It is practical, repeatable, and transparent. Readers should prioritize channels that publish clear updates, explain setbacks openly, and focus on measurable outcomes rather than broad slogans.",
    "From an editorial perspective, useful support content should reduce confusion and improve decisions. That is the standard that helps both audiences and field operators.",
    "",
    "## Conclusion",
    "Helping Ukraine effectively means combining empathy with method. Pick credible channels, support them consistently, and review outcomes on a schedule. This approach is realistic for individual donors and scalable for organizations.",
    "Sustained, transparent support is how solidarity turns into long-term stability for Ukrainian communities."
  ].join("\n\n");

  return body;
}

async function createLeonardoGeneration(prompt) {
  const response = await fetch(LEONARDO_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${LEONARDO_API_KEY}`
    },
    body: JSON.stringify({
      prompt,
      modelId: LEONARDO_MODEL_ID,
      width: 1536,
      height: 1024,
      num_images: 1,
      presetStyle: "CINEMATIC"
    })
  });

  if (!response.ok) {
    throw new Error(`Leonardo create failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const generationId = payload?.generationId || payload?.sdGenerationJob?.generationId || payload?.sdGenerationJob?.id;
  if (!generationId) {
    throw new Error("Leonardo generation id missing");
  }
  return generationId;
}

function extractImageUrl(payload) {
  const root = payload?.generations_by_pk || payload?.sdGenerationJob || payload;
  const images = root?.generated_images || root?.images || [];
  for (const image of images) {
    const candidate =
      image?.url || image?.generated_image?.url || image?.generatedImageUrl || image?.imageUrl;
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function waitForLeonardoImage(generationId) {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const response = await fetch(`${LEONARDO_API}/${generationId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${LEONARDO_API_KEY}`
      }
    });
    if (!response.ok) {
      throw new Error(`Leonardo lookup failed: ${response.status} ${await response.text()}`);
    }
    const payload = await response.json();
    const imageUrl = extractImageUrl(payload);
    if (imageUrl) {
      return imageUrl;
    }
    await new Promise((resolve) => setTimeout(resolve, 3500));
  }
  throw new Error("Leonardo generation timeout");
}

async function generateCover(title) {
  const prompt = [
    `Minimal editorial illustration inspired by Ukrainian gratitude and resilience.`,
    `Scene based on headline: "${title}".`,
    "Warm human-centered composition, Ukrainian blue and yellow accents, civic solidarity mood.",
    "Clean magazine style, no text, no logos, high detail, natural lighting, 16:9."
  ].join(" ");

  const generationId = await createLeonardoGeneration(prompt);
  return waitForLeonardoImage(generationId);
}

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3
  });

  try {
    for (let i = 0; i < POSTS.length; i += 1) {
      const post = POSTS[i];
      const body = buildBody(post.title);
      const coverImageUrl = await generateCover(post.title);
      const excerpt = clamp(
        "Editorial blog analysis on practical long-term support for Ukraine with focus on transparency, resilience, and measurable impact.",
        160
      );
      const metaTitle = clamp(`${post.title} | NewUkraineDaily Blog`, 70);
      const metaDescription = clamp(
        "Blog post on supporting Ukraine effectively: donor consistency, transparency, and long-term community resilience.",
        160
      );

      await pool.query(
        `
          insert into blog_posts (
            slug, title, excerpt, body, tags, cover_image_url,
            og_image_url, og_image_alt, canonical_url, meta_title, meta_description,
            status, published_at, updated_at
          ) values (
            $1, $2, $3, $4, $5::text[], $6,
            $7, $8, $9, $10, $11,
            'published', timezone('utc', now()) - ($12::int * interval '1 hour'), timezone('utc', now())
          )
          on conflict (slug) do update set
            title = excluded.title,
            excerpt = excluded.excerpt,
            body = excluded.body,
            tags = excluded.tags,
            cover_image_url = excluded.cover_image_url,
            og_image_url = excluded.og_image_url,
            og_image_alt = excluded.og_image_alt,
            canonical_url = excluded.canonical_url,
            meta_title = excluded.meta_title,
            meta_description = excluded.meta_description,
            status = excluded.status,
            updated_at = timezone('utc', now())
        `,
        [
          post.slug,
          post.title,
          excerpt,
          body,
          post.tags,
          coverImageUrl,
          coverImageUrl,
          `Ukrainian gratitude editorial illustration for ${post.title}`,
          `https://www.newukrainedaily.com/blog/${post.slug}`,
          metaTitle,
          metaDescription,
          i + 1
        ]
      );

      console.log(`[publish-blog-ukraine-style] upserted ${i + 1}/${POSTS.length}: ${post.slug}`);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[publish-blog-ukraine-style] failed:", error);
  process.exit(1);
});
