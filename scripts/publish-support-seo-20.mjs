import process from "node:process";
import crypto from "node:crypto";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;

loadLocalEnv(process.cwd());

const BASE_URL = (process.env.PUBLIC_BASE_URL || "https://www.newukrainedaily.com").replace(/\/+$/, "");
const LEONARDO_KEY = process.env.LEONARDO_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1/generations";
const LEONARDO_MODEL_ID = "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
}

if (!LEONARDO_KEY) {
  throw new Error("LEONARDO_API_KEY is required.");
}

const TOPIC_DEFINITIONS = [
  ["ukraine-support", "Ukraine Support", "Practical support methods, coordination, and long-term resilience work."],
  ["donate-ukraine", "Donate for Ukraine", "Donation strategy, transparency, and operational donor guidance."],
  ["humanitarian-aid", "Humanitarian Aid", "Medical, shelter, and civilian protection support initiatives."],
  ["reconstruction", "Reconstruction", "Recovery planning and project execution across communities."],
  ["energy-resilience", "Energy Resilience", "Energy security, winter preparedness, and infrastructure continuity."],
  ["civil-society", "Civil Society", "Volunteer networks, NGOs, and local social support ecosystems."]
];

const ARTICLE_PLAN = [
  ["How to Help Ukraine in 2026: A Practical Donor Roadmap", "donor roadmap", "Ukraine support"],
  ["Best Ways to Donate to Ukraine Without Losing Impact", "donation efficiency", "donate Ukraine"],
  ["Support Ukraine Monthly: Why Recurring Donations Work Better", "recurring support", "support Ukraine monthly"],
  ["Humanitarian Aid for Ukraine: What Actually Reaches People", "humanitarian logistics", "humanitarian aid Ukraine"],
  ["How Communities Support Ukraine Beyond Emergency Headlines", "community action", "community support Ukraine"],
  ["Ukraine Relief Funding: How to Evaluate Transparency Fast", "donor due diligence", "Ukraine relief transparency"],
  ["How to Build a Reliable Ukraine Donation Strategy", "portfolio giving", "Ukraine donation strategy"],
  ["Supporting Ukraine in Winter: Energy and Survival Priorities", "winter resilience", "support Ukraine winter"],
  ["How Businesses Can Support Ukraine With Measurable Results", "business support", "business support Ukraine"],
  ["Ukraine Recovery Support: Turning Donations Into Long-Term Impact", "recovery planning", "Ukraine recovery support"],
  ["Medical Support for Ukraine: What Donors Should Prioritize", "medical response", "medical support Ukraine"],
  ["Support Ukraine From Abroad: A Clear Action Framework", "international support", "support Ukraine abroad"],
  ["How to Avoid Low-Quality Ukraine Donation Campaigns", "fraud risk", "safe Ukraine donation"],
  ["Ukraine Humanitarian Funding: A 90-Day Planning Model", "90 day planning", "Ukraine humanitarian funding"],
  ["Why Small Donations Still Matter for Ukraine at Scale", "small donors", "small donation Ukraine"],
  ["Civil Society and Ukraine: Where Support Creates Real Stability", "civil society", "civil society Ukraine"],
  ["How to Combine Aid, Advocacy, and Donations for Ukraine", "hybrid support", "aid and advocacy Ukraine"],
  ["Ukraine Support for Families: What Help Is Most Urgent", "family support", "Ukraine family aid"],
  ["Long-Term Support for Ukraine: A Donor Playbook", "long-term strategy", "long-term support Ukraine"],
  ["How to Keep Helping Ukraine Consistently Through 2026", "consistency", "help Ukraine consistently"]
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(text, max) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return normalized.slice(0, Math.max(1, max - 1)).trim() + "…";
}

function charsWithoutSpaces(text) {
  return String(text || "").replace(/\s+/g, "").length;
}

function wordsCount(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized ? normalized.split(" ").length : 0;
}

function readingMinutes(text) {
  return Math.max(1, Math.ceil(wordsCount(text) / 220));
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildBody({ title, angle, keyword, links }) {
  const relatedCoverage = links
    .slice(0, 5)
    .map((link, index) => `${index + 1}. ${link.title}: ${BASE_URL}/news/${link.slug}`)
    .join("\n");

  const body = [
    `## Intro`,
    `${title} is part of a broader discussion about sustainable public support for Ukraine. The short-term reaction cycle has already shown its limits, so the practical question now is how people can keep helping in ways that stay measurable and useful over time. This editorial article is focused on ${keyword}, with clear steps that can be applied by individual donors, volunteer groups, and small teams.`,
    `Support decisions become stronger when they are treated like a repeatable process instead of one emotional click. A consistent process improves planning, lowers operational waste, and gives organizations enough predictability to deliver on field needs.`,
    ``,
    `## What Happened`,
    `During the last two years, many support initiatives have shifted from one-time emergency messaging to operational continuity models. That means more attention to recurring contributions, transparent updates, and explicit explanations of how funds are allocated. In editorial terms, the big change is that readers now expect proof of execution, not just intent.`,
    `Coverage around ${angle} reflects the same transition. The audience wants clarity on what is funded, how fast it is delivered, and which bottlenecks are slowing impact. This is why strong support journalism now includes process details, baseline timelines, and realistic expectations rather than generic appeals.`,
    ``,
    `## Key Details`,
    `A practical support framework has three layers. First, immediate response: medicine, shelter materials, local logistics, and emergency services. Second, continuity: stable monthly funding so teams can plan procurement and avoid stop-start disruptions. Third, resilience: rebuilding critical capacity so communities can function under pressure with less external shock.`,
    `For ${keyword}, the same rule applies across all layers: match the contribution to a defined objective and verify updates at fixed intervals. If the objective is vague, impact is usually weak. If the objective is concrete, even modest contributions can support meaningful outcomes at scale.`,
    `This approach also helps reduce misinformation and fatigue. Readers are more likely to keep supporting a cause when they understand where resources go and when they can expect results to be visible.`,
    ``,
    `## Why It Matters`,
    `Ukraine support is no longer a short event cycle. It is an extended systems challenge touching public services, infrastructure, social stability, and international coordination. That context makes disciplined support behavior more important than short bursts of visibility.`,
    `When support is predictable, organizations can negotiate better costs, maintain staff continuity, and avoid emergency purchasing patterns that reduce efficiency. In practice, this converts donor intent into higher real-world impact without requiring unrealistic budgets.`,
    ``,
    `## Additional Context`,
    `Editorial analysis of support flows shows that mixed portfolios tend to perform better than single-track giving. A mixed portfolio can include humanitarian response, household resilience, and local recovery projects at the same time. This is especially relevant when conditions change quickly, because a single stream can become temporarily blocked.`,
    `Another important factor is communication quality. Responsible operators explain constraints, delays, and tradeoffs openly. That transparency improves trust and gives supporters a realistic picture of progress. For ${keyword}, the strongest channels are the ones that publish both achievements and limitations in plain language.`,
    `Readers should also consider geography, seasonality, and local capacity. Needs are not static, and effective support plans are reviewed regularly instead of left unchanged for months.`,
    ``,
    `## Editorial Insight`,
    `A newsroom perspective on ${angle} is simple: support content must be actionable, specific, and accountable. Articles that only amplify urgency without operational detail may increase attention briefly, but they rarely improve outcomes over time. Articles that map decisions, constraints, and execution paths are more useful for both readers and field teams.`,
    `In neutral editorial terms, the strongest support strategy is disciplined consistency. It balances urgency with planning, and it treats transparency as a requirement rather than a branding detail.`,
    ``,
    `## Conclusion`,
    `The most effective way to help Ukraine is to turn concern into a repeatable support routine with clear objectives and periodic review. This model is practical for individuals and scalable for groups. It also aligns with how long-cycle humanitarian and recovery work actually operates.`,
    `For readers focused on ${keyword}, the core message is straightforward: choose fewer channels, verify them well, support them consistently, and evaluate impact on a schedule. Consistency is what converts solidarity into measurable results.`,
    ``,
    `## Related Coverage`,
    relatedCoverage || "No related coverage available yet."
  ].join("\n\n");

  if (charsWithoutSpaces(body) >= 3000) {
    return body;
  }

  const expansion = [
    "",
    "## Extended Analysis",
    "Long-horizon support requires institutions and communities to adapt continuously. Donors and volunteers can improve outcomes by documenting what worked, what failed, and which assumptions changed in the field. That feedback loop matters because static plans become outdated quickly under sustained pressure.",
    "In practice, editorially useful support reporting should track implementation checkpoints, not just announcements. Checkpoints can include delivery timing, service continuity, staffing stability, and corrective actions. This keeps support coverage grounded in execution rather than rhetoric."
  ].join("\n\n");

  return `${body}\n\n${expansion}`;
}

async function createLeonardoGeneration(prompt) {
  const response = await fetch(LEONARDO_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${LEONARDO_KEY}`
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
    throw new Error("Leonardo generation id missing.");
  }
  return generationId;
}

function findLeonardoImage(payload) {
  const root = payload?.generations_by_pk || payload?.sdGenerationJob || payload;
  const images = root?.generated_images || root?.images || [];
  for (const image of images) {
    const url = image?.url || image?.generated_image?.url || image?.generatedImageUrl || image?.imageUrl;
    if (typeof url === "string" && /^https?:\/\//i.test(url)) {
      return url;
    }
  }
  return null;
}

async function getLeonardoImageUrl(generationId) {
  for (let attempt = 1; attempt <= 45; attempt += 1) {
    const response = await fetch(`${LEONARDO_API}/${generationId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${LEONARDO_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Leonardo lookup failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    const status =
      payload?.generations_by_pk?.status || payload?.sdGenerationJob?.status || payload?.status || "UNKNOWN";
    const imageUrl = findLeonardoImage(payload);

    if (imageUrl) {
      return imageUrl;
    }
    if (status === "FAILED") {
      throw new Error("Leonardo generation returned FAILED status.");
    }

    await new Promise((resolve) => setTimeout(resolve, 3500));
  }

  throw new Error("Leonardo generation timeout.");
}

async function generateImagePair(headline, keyword) {
  const previewPrompt = `Minimal editorial illustration about ${keyword} and support for Ukraine, clean geometric composition, restrained blue and yellow palette, modern magazine style, balanced shapes, 16:9, no text, no logos`;
  const generatedPrompt = `Minimal editorial illustration based on headline: "${headline}", conceptual newsroom visual, soft natural contrast, high detail vector-like forms, 16:9, no text, no logos`;

  const previewGeneration = await createLeonardoGeneration(previewPrompt);
  const previewImageUrl = await getLeonardoImageUrl(previewGeneration);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const generatedGeneration = await createLeonardoGeneration(generatedPrompt);
  const generatedImageUrl = await getLeonardoImageUrl(generatedGeneration);

  return {
    previewImageUrl,
    generatedImageUrl,
    generatedPrompt
  };
}

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });

  const now = new Date();

  try {
    const client = await pool.connect();
    try {
      await client.query("begin");

      for (const [tag, title, description] of TOPIC_DEFINITIONS) {
        await client.query(
          `
            insert into topics (tag, title, description)
            values ($1, $2, $3)
            on conflict (tag) do update set
              title = excluded.title,
              description = excluded.description,
              updated_at = timezone('utc', now())
          `,
          [tag, title, description]
        );
      }

      const existingResult = await client.query(
        `
          select id, slug, title, tags, topics, entities
          from news_items
          where status = 'published'
          order by published_at desc nulls last, created_at desc
          limit 30
        `
      );

      const existing = existingResult.rows.map((row) => ({
        id: String(row.id),
        slug: String(row.slug),
        title: String(row.title),
        tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
        topics: Array.isArray(row.topics) ? row.topics.map(String) : [],
        entities: Array.isArray(row.entities) ? row.entities.map(String) : []
      }));

      const batch = [];

      for (let i = 0; i < ARTICLE_PLAN.length; i += 1) {
        const [title, angle, keyword] = ARTICLE_PLAN[i];
        const slugBase = slugify(title);
        const datedSlug = `${slugBase}-${now.toISOString().slice(0, 10)}`;

        const references = [...existing, ...batch].slice(-20).reverse();
        const links = references.slice(0, 5).map((entry) => ({
          slug: entry.slug,
          title: entry.title
        }));

        const body = buildBody({ title, angle, keyword, links });
        const noSpaceCount = charsWithoutSpaces(body);
        if (noSpaceCount < 3000) {
          throw new Error(`Generated body too short for "${title}" (${noSpaceCount}).`);
        }

        const tags = [
          "support",
          "ukraine",
          "donate",
          "humanitarian",
          "recovery",
          slugify(keyword).replace(/-/g, " ")
        ]
          .map((item) => item.toLowerCase())
          .filter((value, index, array) => array.indexOf(value) === index)
          .slice(0, 10);

        const topics = [TOPIC_DEFINITIONS[i % TOPIC_DEFINITIONS.length][0], "ukraine-support"];
        const entities = ["Ukraine", "Europe", "Civil Society", "Humanitarian Network"].slice(0, 4);
        const keyPoints = [
          "Support is most effective when it is recurring and transparent.",
          "Donors should match contributions to concrete operational goals.",
          "Mixed support portfolios improve resilience and continuity.",
          "Editorial accountability helps reduce waste and misinformation."
        ];
        const whyItMatters =
          "Sustainable support for Ukraine depends on disciplined decisions, transparent execution, and long-term continuity rather than one-time reactions.";

        const imagePair = await generateImagePair(title, keyword);
        const publishedAt = addHours(now, -(i + 1));
        const canonicalUrl = `${BASE_URL}/news/${datedSlug}`;
        const metaTitle = clamp(`${title} | NewUkraineDaily`, 70);
        const metaDescription = clamp(
          `Editorial guide on ${keyword} with practical donor actions, context, and long-term support strategy for Ukraine.`,
          160
        );
        const wordCount = wordsCount(body);
        const fingerprint = crypto
          .createHash("sha256")
          .update(`${title}|${keyword}|${publishedAt.toISOString().slice(0, 10)}`)
          .digest("hex");

        const relatedLinks = links.map((link, index) => ({
          type: "article",
          href: `/news/${link.slug}`,
          title: link.title,
          anchor: ["related analysis", "background reporting", "latest updates", "topic overview", "context article"][index]
        }));

        await client.query(
          `
            insert into news_items (
              slug, title, dek, summary, content, key_points, why_it_matters, tags, topics, entities,
              cover_image_url, og_image_url, og_image_alt, preview_image_url, preview_image_source, preview_image_caption,
              generated_image_prompt, generated_image_url, generated_image_alt, generated_image_caption,
              source_name, source_url, canonical_url, meta_title, meta_description,
              reading_time_minutes, word_count, char_count, internal_links, related_ids,
              fingerprint, is_duplicate, quality_score, primary_topic, location, indexable,
              status, language, published_at, created_at, updated_at
            ) values (
              $1, $2, $3, $4, $5, $6::jsonb, $7, $8::text[], $9::text[], $10::text[],
              $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23, $24, $25,
              $26, $27, $28, $29::jsonb, '{}'::uuid[],
              $30, false, $31, $32, $33, true,
              'published', 'en', $34, timezone('utc', now()), timezone('utc', now())
            )
            on conflict (slug) do update set
              title = excluded.title,
              dek = excluded.dek,
              summary = excluded.summary,
              content = excluded.content,
              key_points = excluded.key_points,
              why_it_matters = excluded.why_it_matters,
              tags = excluded.tags,
              topics = excluded.topics,
              entities = excluded.entities,
              cover_image_url = excluded.cover_image_url,
              og_image_url = excluded.og_image_url,
              og_image_alt = excluded.og_image_alt,
              preview_image_url = excluded.preview_image_url,
              preview_image_source = excluded.preview_image_source,
              preview_image_caption = excluded.preview_image_caption,
              generated_image_prompt = excluded.generated_image_prompt,
              generated_image_url = excluded.generated_image_url,
              generated_image_alt = excluded.generated_image_alt,
              generated_image_caption = excluded.generated_image_caption,
              source_name = excluded.source_name,
              source_url = excluded.source_url,
              canonical_url = excluded.canonical_url,
              meta_title = excluded.meta_title,
              meta_description = excluded.meta_description,
              reading_time_minutes = excluded.reading_time_minutes,
              word_count = excluded.word_count,
              char_count = excluded.char_count,
              internal_links = excluded.internal_links,
              fingerprint = excluded.fingerprint,
              quality_score = excluded.quality_score,
              primary_topic = excluded.primary_topic,
              location = excluded.location,
              indexable = excluded.indexable,
              status = excluded.status,
              language = excluded.language,
              published_at = excluded.published_at,
              updated_at = timezone('utc', now())
          `,
          [
            datedSlug,
            title,
            `A practical editorial guide to ${keyword} and measurable support outcomes.`,
            `Detailed analysis of ${keyword}, with donor strategy, context, and execution guidance for sustained support.`,
            body,
            JSON.stringify(keyPoints),
            whyItMatters,
            tags,
            topics,
            entities,
            imagePair.previewImageUrl,
            imagePair.generatedImageUrl,
            `Minimal editorial illustration for ${title}`,
            imagePair.previewImageUrl,
            "NewUkraineDaily Editorial Desk",
            "Preview illustration in minimal editorial style for the article topic.",
            imagePair.generatedPrompt,
            imagePair.generatedImageUrl,
            `AI editorial illustration for ${title}`,
            "Illustration generated with AI (Leonardo) based on the headline",
            "NewUkraineDaily Editorial Desk",
            `${BASE_URL}/donate`,
            canonicalUrl,
            metaTitle,
            metaDescription,
            readingMinutes(body),
            wordCount,
            body.length,
            JSON.stringify(relatedLinks),
            fingerprint,
            0.96,
            topics[0],
            "Ukraine",
            publishedAt.toISOString()
          ]
        );

        batch.push({
          slug: datedSlug,
          title,
          tags,
          topics,
          entities
        });

        process.stdout.write(
          `[publish-support-seo-20] published ${i + 1}/20: ${datedSlug}, chars_no_spaces=${noSpaceCount}\n`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      await client.query("commit");
      process.stdout.write("[publish-support-seo-20] transaction committed\n");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[publish-support-seo-20] failed:", error);
  process.exit(1);
});
