import process from "node:process";
import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Pool } = pg;
loadLocalEnv();

const topics = [
  ["humanitarian", "Humanitarian Support", "Aid delivery, medical support, shelter, and civilian protection coverage."],
  ["energy", "Energy Resilience", "Power infrastructure, winter resilience, and civilian energy security."],
  ["recovery", "Recovery", "Reconstruction planning, funding, and long-term recovery initiatives."],
  ["policy", "Policy", "Government, sanctions, funding, and security policy developments."],
  ["support", "Support Ukraine", "Practical support, humanitarian assistance, and civil society response."],
  ["logistics", "Logistics", "Delivery systems, warehousing, and cross-border support operations."],
  ["diplomacy", "Diplomacy", "International coordination and diplomatic engagement around Ukraine."]
];

const newsItems = [
  {
    slug: "nato-marks-four-years-of-full-scale-invasion-support-for-ukraine",
    title: "NATO marks four years of the full-scale invasion with renewed support message",
    dek: "NATO marked February 24, 2026 with a ceremony and a NATO-Ukraine Council meeting focused on sustained support for Ukraine.",
    summary:
      "On February 24, 2026, NATO used the fourth anniversary of Russia's full-scale invasion to restate that support for Ukraine remains an alliance priority.\n\nThe update highlighted the NATO-Ukraine Council, the NSATU command in Wiesbaden, and the PURL procurement mechanism as core parts of the current support structure.",
    keyPoints: [
      "NATO marked February 24, 2026 with a public support message for Ukraine.",
      "The alliance highlighted the NATO-Ukraine Council and support coordination structures.",
      "The message focused on continuity of assistance rather than a symbolic statement alone."
    ],
    whyItMatters:
      "This signals that institutional military support for Ukraine remains active and coordinated.\n\nFor readers, the importance is continuity: NATO is presenting its Ukraine support as structured, ongoing policy.",
    tags: ["diplomacy", "support", "policy"],
    sourceName: "NATO News",
    sourceUrl:
      "https://www.nato.int/en/news-and-events/articles/news/2026/02/24/nato-commemorates-the-fourth-anniversary-of-russias-full-scale-invasion-of-ukraine",
    coverImageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-24T09:00:00.000Z"
  },
  {
    slug: "uk-extends-renewal-window-for-ukrainians-seeking-sanctuary",
    title: "UK extends renewal window for Ukrainians seeking sanctuary",
    dek: "The UK government said Ukrainians will be able to apply earlier to renew their stay under the Ukraine Permission Scheme.",
    summary:
      "A February 25, 2026 UK government update said Ukrainians offered sanctuary will be able to renew their stay earlier, reducing uncertainty for families already in the country.\n\nThe practical change is a longer application window: up to 90 days before expiry instead of 28 days.",
    keyPoints: [
      "The renewal window expands from 28 days to 90 days before expiry.",
      "The policy affects Ukrainians already in the UK under sanctuary arrangements.",
      "The change is designed to reduce uncertainty for families."
    ],
    whyItMatters:
      "This affects legal stability and planning for displaced Ukrainians in the UK.\n\nIt is directly relevant to support coverage even though it is not battlefield news.",
    tags: ["support", "policy", "humanitarian"],
    sourceName: "GOV.UK",
    sourceUrl:
      "https://www.gov.uk/government/news/ukrainians-to-receive-greater-certainty-about-their-futures",
    coverImageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-25T14:30:00.000Z"
  },
  {
    slug: "uk-announces-fresh-package-of-military-humanitarian-and-reconstruction-support",
    title: "UK announces fresh package of military, humanitarian and reconstruction support",
    dek: "The UK said on February 24, 2026 that it is increasing support for Ukraine across military, humanitarian and reconstruction lines.",
    summary:
      "A February 24, 2026 UK government statement framed support for Ukraine as a combined military, humanitarian and reconstruction effort rather than a single-package response.\n\nThe release linked new support directly to European security and positioned continued assistance as part of the UK's broader strategic posture.",
    keyPoints: [
      "The package spans military, humanitarian and reconstruction support.",
      "The UK tied the package to broader European security interests.",
      "The release frames support as sustained policy rather than a one-off action."
    ],
    whyItMatters:
      "This shows how Ukraine support is being integrated into long-term state policy.\n\nIt is relevant to both funding and strategic support coverage.",
    tags: ["support", "policy", "recovery"],
    sourceName: "GOV.UK",
    sourceUrl:
      "https://www.gov.uk/government/news/uk-steps-up-support-for-ukraine-four-years-on-from-putins-full-scale-invasion",
    coverImageUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-24T11:15:00.000Z"
  },
  {
    slug: "who-says-attacks-on-ukraine-health-care-rose-in-2025",
    title: "WHO says attacks on Ukraine's health care rose in 2025",
    dek: "WHO reported on February 23, 2026 that verified attacks on health care in Ukraine increased by nearly 20% in 2025.",
    summary:
      "WHO said Ukraine experienced its highest number of documented attacks on health care in 2025, with hospitals, workers, ambulances and warehouses affected.\n\nThe release also connected the problem to winter energy attacks, arguing that damage to heating and power systems has deepened health vulnerabilities well beyond hospital walls.",
    keyPoints: [
      "WHO says documented attacks on health care increased in 2025.",
      "Hospitals, ambulances and staff were among the affected targets.",
      "The organization linked winter energy attacks to broader health risks."
    ],
    whyItMatters:
      "This is a strong verified humanitarian and public-health update.\n\nIt connects medical access, infrastructure pressure and civilian vulnerability in one institutional source.",
    tags: ["humanitarian", "support", "energy"],
    sourceName: "WHO Europe",
    sourceUrl:
      "https://www.who.int/europe/news/item/23-02-2026-attacks-on-ukraine-s-health-care-increased-by-20--in-2025",
    coverImageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-23T10:00:00.000Z"
  },
  {
    slug: "health-cluster-says-four-years-of-coordination-reached-millions-in-ukraine",
    title: "Health Cluster says four years of coordination reached millions in Ukraine",
    dek: "The WHO-led Health Cluster said its coordinated response has helped sustain care for millions since the full-scale invasion began.",
    summary:
      "The Health Cluster's February 24, 2026 note focused on the cumulative effect of four years of coordination rather than one isolated delivery event.\n\nIt highlighted mobile medical teams, emergency support to damaged facilities and continued coordination across a wide partner network.",
    keyPoints: [
      "The update focuses on the cumulative impact of four years of health coordination.",
      "Mobile teams and support to damaged facilities were highlighted.",
      "The note presents a systems-level picture of the humanitarian health response."
    ],
    whyItMatters:
      "This provides broader context for the health response beyond a single incident.\n\nIt helps frame what long-run humanitarian coordination has looked like in practice.",
    tags: ["humanitarian", "support", "recovery"],
    sourceName: "WHO Health Cluster",
    sourceUrl:
      "https://healthcluster.who.int/newsroom/news/item/24-02-2026-four-years-of-impact-health-coordination-that-reaches-millions-in-ukraine",
    coverImageUrl:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-24T16:20:00.000Z"
  },
  {
    slug: "world-bank-update-puts-ukraine-recovery-needs-near-588-billion",
    title: "World Bank update puts Ukraine's recovery and reconstruction needs near $588 billion",
    dek: "A February 23, 2026 joint assessment estimated Ukraine's reconstruction and recovery needs at almost $588 billion over the next decade.",
    summary:
      "The updated RDNA5, released on February 23, 2026 by the Government of Ukraine, the World Bank Group, the European Commission and the United Nations, estimated almost $588 billion in needs over ten years.\n\nThe assessment pointed to major pressures in housing, transport and energy, while also noting that urgent repairs and early recovery efforts have already addressed part of the burden.",
    keyPoints: [
      "The assessment estimates nearly $588 billion in needs over ten years.",
      "Housing, transport and energy are among the largest pressure areas.",
      "The update was issued jointly by Ukrainian and international institutions."
    ],
    whyItMatters:
      "This is one of the clearest institutional reference points for reconstruction coverage.\n\nIt ties headline need estimates to sector-specific damage and spending priorities.",
    tags: ["recovery", "policy", "energy"],
    sourceName: "World Bank",
    sourceUrl:
      "https://www.worldbank.org/en/news/press-release/2026/02/23/updated-ukraine-recovery-and-reconstruction-needs-assessment-released",
    coverImageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-23T18:10:00.000Z"
  },
  {
    slug: "eu-council-backs-90-billion-ukraine-support-loan-framework",
    title: "EU Council backs legal framework for a €90 billion Ukraine support loan",
    dek: "The Council agreed its position on a legal framework intended to provide €90 billion in support to Ukraine in 2026 and 2027.",
    summary:
      "On February 4, 2026, the Council said it had agreed its position on the legal framework implementing a €90 billion loan for Ukraine for 2026-2027.\n\nAccording to the release, the support is aimed at urgent financing needs including general budget support and defence-related requirements.",
    keyPoints: [
      "The framework covers support for 2026 and 2027.",
      "The package is designed for urgent financing needs.",
      "The release places Ukraine support inside formal EU legal structures."
    ],
    whyItMatters:
      "This is a major policy and financing signal from the EU side.\n\nIt helps explain how large-scale Ukraine support is being formalized institutionally.",
    tags: ["policy", "support", "recovery"],
    sourceName: "Consilium",
    sourceUrl:
      "https://www.consilium.europa.eu/en/press/press-releases/2026/02/04/council-agrees-position-on-legal-framework-to-provide-90-billion-in-financial-support-to-ukraine/",
    coverImageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-04T13:00:00.000Z"
  },
  {
    slug: "who-launches-42-million-ukraine-health-appeal-for-2026",
    title: "WHO launches a $42 million Ukraine health appeal for 2026",
    dek: "WHO said on February 6, 2026 that it is seeking US$42 million to help protect access to health care in Ukraine.",
    summary:
      "WHO's February 6, 2026 appeal requested US$42 million to protect care access for 700,000 people as the war entered its fifth year.\n\nThe organization said ongoing hostilities, repeated attacks on civilian infrastructure and displacement continue to strain service delivery across the country.",
    keyPoints: [
      "WHO is seeking $42 million for Ukraine health support in 2026.",
      "The appeal covers access to care for 700,000 people.",
      "The organization links health strain to conflict, infrastructure attacks and displacement."
    ],
    whyItMatters:
      "This is a current institutional funding signal for humanitarian health needs.\n\nIt helps show what health-sector priorities look like in concrete resource terms.",
    tags: ["humanitarian", "support", "policy"],
    sourceName: "WHO Europe",
    sourceUrl:
      "https://www.who.int/europe/news/item/06-02-2026-ukraine--who-seeks-us-42-million-in-2026-to-protect-health-care-as-war-enters-its-fifth-year",
    coverImageUrl:
      "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-06T09:40:00.000Z"
  },
  {
    slug: "uk-announces-500-million-plus-air-defence-package-for-ukraine",
    title: "UK announces air-defence package for Ukraine worth more than £500 million",
    dek: "The UK said on February 12, 2026 it would provide a new air-defence package including funding for NATO PURL and additional missiles.",
    summary:
      "The UK government said the package included £150 million for NATO's PURL initiative and additional UK-manufactured missiles for Ukraine.\n\nThe release explicitly framed the package as a response to attacks on energy sites, homes and other infrastructure.",
    keyPoints: [
      "The package is worth more than £500 million.",
      "It includes funding for NATO PURL and additional missiles.",
      "The UK linked the package to protection of infrastructure and civilians."
    ],
    whyItMatters:
      "This is a concrete support announcement with clear operational detail.\n\nIt also connects defence assistance directly to civilian infrastructure protection.",
    tags: ["support", "policy", "energy"],
    sourceName: "GOV.UK",
    sourceUrl:
      "https://www.gov.uk/government/news/uk-announces-urgent-new-air-defence-package-for-ukraine-worth-over-half-a-billion-pounds",
    coverImageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-12T15:45:00.000Z"
  },
  {
    slug: "uk-highlights-humanitarian-winter-support-for-ukraine",
    title: "UK highlights humanitarian winter support for Ukraine",
    dek: "A February 6, 2026 UK government release said UK-funded support had helped more than 1 million Ukrainians affected by the winter energy crisis.",
    summary:
      "The UK government said its support had reached more than 1 million Ukrainians affected by winter energy disruption, with help including generators, hygiene kits and assistance to restore heat and water.\n\nThe release tied humanitarian support directly to the practical effects of strikes on infrastructure during severe winter conditions.",
    keyPoints: [
      "The UK says more than 1 million Ukrainians were reached by winter support.",
      "Support included generators, hygiene kits, heat and water assistance.",
      "The release directly connects the response to winter energy disruption."
    ],
    whyItMatters:
      "This is a concrete humanitarian support story based on practical delivery, not just political messaging.\n\nIt adds a winter resilience angle to the feed.",
    tags: ["humanitarian", "support", "energy"],
    sourceName: "GOV.UK",
    sourceUrl:
      "https://www.gov.uk/government/news/uk-provides-vital-humanitarian-support-as-ukraine-suffers-through-brutal-winter",
    coverImageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-06T10:30:00.000Z"
  }
];

const blogPosts = [
  {
    slug: "how-to-structure-a-ukraine-support-newsroom",
    title: "How to structure a Ukraine support newsroom for speed and trust",
    excerpt:
      "A practical editorial framework for publishing fast without drifting into noise, duplication, or weak sourcing.",
    body:
      "A reliable newsroom flow starts with disciplined inputs. Sources need to be curated, logged, and reviewed on a predictable cadence rather than pulled ad hoc from noisy channels.\n\nThe second layer is editorial transformation. Rewrites should keep attribution explicit, strip out duplication, and preserve only what the source can support.\n\nFinally, publication needs a visible standard. A site that explains how it reviews source material is easier to trust, easier to improve, and easier to scale.",
    tags: ["policy", "support"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-25T08:00:00.000Z"
  },
  {
    slug: "what-makes-a-good-support-page",
    title: "What makes a support page actually useful",
    excerpt:
      "Donation and support pages fail when they are vague. They work when they reduce hesitation and tell the user exactly what comes next.",
    body:
      "The strongest support pages answer three questions immediately: where help goes, what kind of support is needed, and how frequently the page is updated.\n\nUsers hesitate when a site makes them infer too much. Simple structure, source links, and clear topic groupings outperform overloaded layouts.\n\nThe result is not just better conversion. It is a more credible product.",
    tags: ["support", "humanitarian"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-24T12:00:00.000Z"
  },
  {
    slug: "why-topic-pages-matter-for-an-advocacy-site",
    title: "Why topic pages matter for an advocacy-driven news site",
    excerpt:
      "Topic archives do more than help SEO. They also make the site easier to trust, browse, and cite.",
    body:
      "A strong topic page reduces the cost of understanding. Instead of forcing readers to reconstruct context from isolated headlines, it groups reporting into a stable reference point.\n\nThat structure also helps internal linking, related-story discovery, and clearer metadata across the site.\n\nIn practice, topic pages are part content product and part information architecture.",
    tags: ["policy", "diplomacy"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-23T08:30:00.000Z"
  },
  {
    slug: "how-to-evaluate-donation-links-without-hype",
    title: "How to evaluate donation links without hype",
    excerpt:
      "A short framework for deciding whether a support recommendation is credible enough to publish.",
    body:
      "Not every support link deserves publication. At minimum, readers should be able to see who operates it, what it funds, and whether the information is still current.\n\nThat baseline reduces reputational risk and helps the site avoid performative recommendations that do not actually help users act.\n\nThe editorial rule is simple: publish fewer links, but make them stronger.",
    tags: ["support", "policy"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-22T11:45:00.000Z"
  },
  {
    slug: "building-a-recovery-coverage-calendar",
    title: "Building a recovery coverage calendar that stays useful",
    excerpt:
      "Recovery reporting improves when editors plan around delivery milestones, not just headline spikes.",
    body:
      "Recovery is easy to cover superficially and harder to cover well. The best editorial calendars follow project phases rather than waiting for isolated announcements.\n\nThat means watching procurement, contract awards, repair starts, delivery checkpoints, and handover milestones.\n\nThe reward is better continuity and better accountability.",
    tags: ["recovery", "policy"],
    coverImageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
    publishedAt: "2026-02-21T07:15:00.000Z"
  }
];

function readDatabaseUrl() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL is required.");
  }

  return url;
}

async function main() {
  const pool = new Pool({
    connectionString: readDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000
  });

  try {
    const client = await pool.connect();

    try {
      await client.query("begin");

      for (const [tag, title, description] of topics) {
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

      for (const item of newsItems) {
        await client.query(
          `
            insert into news_items (
              slug, title, dek, summary, key_points, why_it_matters, tags,
              cover_image_url, og_image_url, source_name, source_url,
              status, language, published_at
            )
            values (
              $1, $2, $3, $4, $5::jsonb, $6, $7,
              $8, $9, $10, $11,
              'published', 'en', $12
            )
            on conflict (slug) do update set
              title = excluded.title,
              dek = excluded.dek,
              summary = excluded.summary,
              key_points = excluded.key_points,
              why_it_matters = excluded.why_it_matters,
              tags = excluded.tags,
              cover_image_url = excluded.cover_image_url,
              og_image_url = excluded.og_image_url,
              source_name = excluded.source_name,
              source_url = excluded.source_url,
              status = excluded.status,
              language = excluded.language,
              published_at = excluded.published_at
          `,
          [
            item.slug,
            item.title,
            item.dek,
            item.summary,
            JSON.stringify(item.keyPoints),
            item.whyItMatters,
            item.tags,
            item.coverImageUrl,
            item.ogImageUrl,
            item.sourceName,
            item.sourceUrl,
            item.publishedAt
          ]
        );
      }

      for (const post of blogPosts) {
        await client.query(
          `
            insert into blog_posts (
              slug, title, excerpt, body, tags, cover_image_url, status, published_at
            )
            values ($1, $2, $3, $4, $5, $6, 'published', $7)
            on conflict (slug) do update set
              title = excluded.title,
              excerpt = excluded.excerpt,
              body = excluded.body,
              tags = excluded.tags,
              cover_image_url = excluded.cover_image_url,
              status = excluded.status,
              published_at = excluded.published_at
          `,
          [
            post.slug,
            post.title,
            post.excerpt,
            post.body,
            post.tags,
            post.coverImageUrl,
            post.publishedAt
          ]
        );
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  console.log("[seed-real-preview-content] completed");
}

main().catch((error) => {
  console.error(
    `[seed-real-preview-content] ${error instanceof Error ? error.message : "Unknown error"}`
  );
  process.exitCode = 1;
});
