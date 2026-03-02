import type { ContentEntry } from "@/lib/content-types";

type PreviewTopic = {
  tag: string;
  title: string;
  description: string;
};

const previewTopics: PreviewTopic[] = [
  {
    tag: "humanitarian",
    title: "Humanitarian Support",
    description: "Aid delivery, medical support, shelter, and civilian protection coverage."
  },
  {
    tag: "energy",
    title: "Energy Resilience",
    description: "Power grid recovery, winter resilience, and infrastructure protection updates."
  },
  {
    tag: "recovery",
    title: "Recovery",
    description: "Reconstruction planning, funding, and local recovery initiatives."
  },
  {
    tag: "policy",
    title: "Policy",
    description: "Sanctions, international coordination, and public policy analysis."
  },
  {
    tag: "support",
    title: "Support Ukraine",
    description: "Ways to help, civil society initiatives, and donation guidance."
  },
  {
    tag: "logistics",
    title: "Logistics",
    description: "Supply chains, delivery routes, warehousing, and operational support."
  },
  {
    tag: "diplomacy",
    title: "Diplomacy",
    description: "International coordination, coalition messaging, and diplomatic developments."
  }
];

const previewEntries: ContentEntry[] = [
  {
    id: "preview-news-1",
    type: "news",
    slug: "nato-marks-four-years-of-full-scale-invasion-support-for-ukraine",
    title: "NATO marks four years of the full-scale invasion with renewed support message",
    description:
      "NATO marked February 24, 2026 with a ceremony and a NATO-Ukraine Council meeting focused on sustained support for Ukraine.",
    excerpt:
      "The alliance said its support infrastructure and procurement initiatives remain central to Ukraine's defence and long-term security.",
    publishedAt: "2026-02-24T09:00:00.000Z",
    updatedAt: "2026-02-24T09:00:00.000Z",
    author: "NATO News",
    tags: ["diplomacy", "support", "policy"],
    body: [
      "On February 24, 2026, NATO used the fourth anniversary of Russia's full-scale invasion to restate that support for Ukraine remains an alliance priority.",
      "The update highlighted the NATO-Ukraine Council, the NSATU command in Wiesbaden, and the PURL procurement mechanism as core parts of the current support structure.",
      "For readers, the key takeaway is continuity rather than a one-day gesture: NATO is signaling that military assistance and coordination for Ukraine remain active and organized."
    ],
    sourceUrl:
      "https://www.nato.int/en/news-and-events/articles/news/2026/02/24/nato-commemorates-the-fourth-anniversary-of-russias-full-scale-invasion-of-ukraine",
    imageUrl:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "International meeting on support for Ukraine",
    status: "published",
    featured: true
  },
  {
    id: "preview-news-2",
    type: "news",
    slug: "uk-extends-renewal-window-for-ukrainians-seeking-sanctuary",
    title: "UK extends renewal window for Ukrainians seeking sanctuary",
    description:
      "The UK government said Ukrainians will be able to apply earlier to renew their stay under the Ukraine Permission Scheme.",
    excerpt:
      "The change expands the application window from 28 days to 90 days before current permission expires.",
    publishedAt: "2026-02-25T14:30:00.000Z",
    updatedAt: "2026-02-25T14:30:00.000Z",
    author: "GOV.UK",
    tags: ["support", "policy", "humanitarian"],
    body: [
      "A February 25, 2026 UK government update said Ukrainians offered sanctuary will be able to renew their stay earlier, reducing uncertainty for families already in the country.",
      "The practical change is a longer application window: up to 90 days before expiry instead of 28 days.",
      "This is not battlefield news, but it is still directly relevant to Ukraine support coverage because it affects legal stability and planning for displaced Ukrainians in the UK."
    ],
    sourceUrl:
      "https://www.gov.uk/government/news/ukrainians-to-receive-greater-certainty-about-their-futures",
    imageUrl:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Support services for displaced families",
    status: "published"
  },
  {
    id: "preview-news-3",
    type: "news",
    slug: "uk-announces-fresh-package-of-military-humanitarian-and-reconstruction-support",
    title: "UK announces fresh package of military, humanitarian and reconstruction support",
    description:
      "The UK said on February 24, 2026 that it is increasing support for Ukraine across military, humanitarian and reconstruction lines.",
    excerpt:
      "The announcement tied Ukraine support directly to wider UK and European security policy.",
    publishedAt: "2026-02-24T11:15:00.000Z",
    updatedAt: "2026-02-24T11:15:00.000Z",
    author: "GOV.UK",
    tags: ["support", "policy", "recovery"],
    body: [
      "A February 24, 2026 UK government statement framed support for Ukraine as a combined military, humanitarian and reconstruction effort rather than a single-package response.",
      "The release linked new support directly to European security and positioned continued assistance as part of the UK's broader strategic posture.",
      "For publication purposes, this belongs in the policy and support mix because it signals political commitment, not just one-off matériel delivery."
    ],
    sourceUrl:
      "https://www.gov.uk/government/news/uk-steps-up-support-for-ukraine-four-years-on-from-putins-full-scale-invasion",
    imageUrl:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Policy announcement on support for Ukraine",
    status: "published"
  },
  {
    id: "preview-news-4",
    type: "news",
    slug: "who-says-attacks-on-ukraine-health-care-rose-in-2025",
    title: "WHO says attacks on Ukraine's health care rose in 2025",
    description:
      "WHO reported on February 23, 2026 that verified attacks on health care in Ukraine increased by nearly 20% in 2025.",
    excerpt:
      "The organization linked direct strikes and energy damage to worsening health access and rising system pressure.",
    publishedAt: "2026-02-23T10:00:00.000Z",
    updatedAt: "2026-02-23T10:00:00.000Z",
    author: "WHO Europe",
    tags: ["humanitarian", "support", "energy"],
    body: [
      "WHO said Ukraine experienced its highest number of documented attacks on health care in 2025, with hospitals, workers, ambulances and warehouses affected.",
      "The release also connected the problem to winter energy attacks, arguing that damage to heating and power systems has deepened health vulnerabilities well beyond hospital walls.",
      "This matters for the site because it combines humanitarian, infrastructure and public-health angles in one verified institutional update."
    ],
    sourceUrl:
      "https://www.who.int/europe/news/item/23-02-2026-attacks-on-ukraine-s-health-care-increased-by-20--in-2025",
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Medical support under wartime pressure",
    status: "published"
  },
  {
    id: "preview-news-5",
    type: "news",
    slug: "health-cluster-says-four-years-of-coordination-reached-millions-in-ukraine",
    title: "Health Cluster says four years of coordination reached millions in Ukraine",
    description:
      "The WHO-led Health Cluster said its coordinated response has helped sustain care for millions since the full-scale invasion began.",
    excerpt:
      "The February 24, 2026 update emphasized mobile care, essential supplies and system resilience despite continuing damage.",
    publishedAt: "2026-02-24T16:20:00.000Z",
    updatedAt: "2026-02-24T16:20:00.000Z",
    author: "WHO Health Cluster",
    tags: ["humanitarian", "support", "recovery"],
    body: [
      "The Health Cluster's February 24, 2026 note focused on the cumulative effect of four years of coordination rather than one isolated delivery event.",
      "It highlighted mobile medical teams, emergency support to damaged facilities and continued coordination across a wide partner network.",
      "This is useful editorially because it gives a verified systems-level picture of humanitarian health support rather than a single anecdotal update."
    ],
    sourceUrl:
      "https://healthcluster.who.int/newsroom/news/item/24-02-2026-four-years-of-impact-health-coordination-that-reaches-millions-in-ukraine",
    imageUrl:
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Health support coordination in Ukraine response",
    status: "published"
  },
  {
    id: "preview-news-6",
    type: "news",
    slug: "world-bank-update-puts-ukraine-recovery-needs-near-588-billion",
    title: "World Bank update puts Ukraine's recovery and reconstruction needs near $588 billion",
    description:
      "A February 23, 2026 joint assessment estimated Ukraine's reconstruction and recovery needs at almost $588 billion over the next decade.",
    excerpt:
      "The update highlighted housing, transport and energy as major damage and spending priorities.",
    publishedAt: "2026-02-23T18:10:00.000Z",
    updatedAt: "2026-02-23T18:10:00.000Z",
    author: "World Bank",
    tags: ["recovery", "policy", "energy"],
    body: [
      "The updated RDNA5, released on February 23, 2026 by the Government of Ukraine, the World Bank Group, the European Commission and the United Nations, estimated almost $588 billion in needs over ten years.",
      "The assessment pointed to major pressures in housing, transport and energy, while also noting that urgent repairs and early recovery efforts have already addressed part of the burden.",
      "This is one of the clearest recent reference points for recovery coverage because it ties headline funding needs to sector-level damage."
    ],
    sourceUrl:
      "https://www.worldbank.org/en/news/press-release/2026/02/23/updated-ukraine-recovery-and-reconstruction-needs-assessment-released",
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Recovery assessment and reconstruction planning",
    status: "published"
  },
  {
    id: "preview-news-7",
    type: "news",
    slug: "eu-council-backs-90-billion-ukraine-support-loan-framework",
    title: "EU Council backs legal framework for a €90 billion Ukraine support loan",
    description:
      "The Council agreed its position on a legal framework intended to provide €90 billion in support to Ukraine in 2026 and 2027.",
    excerpt:
      "The package is designed to help finance budget, defence and industrial support needs.",
    publishedAt: "2026-02-04T13:00:00.000Z",
    updatedAt: "2026-02-04T13:00:00.000Z",
    author: "Consilium",
    tags: ["policy", "support", "recovery"],
    body: [
      "On February 4, 2026, the Council said it had agreed its position on the legal framework implementing a €90 billion loan for Ukraine for 2026-2027.",
      "According to the release, the support is aimed at urgent financing needs including general budget support and defence-related requirements.",
      "This is important for the site's recovery and policy sections because it shows how large-scale Ukraine support is being formalized inside EU structures."
    ],
    sourceUrl:
      "https://www.consilium.europa.eu/en/press/press-releases/2026/02/04/council-agrees-position-on-legal-framework-to-provide-90-billion-in-financial-support-to-ukraine/",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "European financial support framework documents",
    status: "published"
  },
  {
    id: "preview-news-8",
    type: "news",
    slug: "who-launches-42-million-ukraine-health-appeal-for-2026",
    title: "WHO launches a $42 million Ukraine health appeal for 2026",
    description:
      "WHO said on February 6, 2026 that it is seeking US$42 million to help protect access to health care in Ukraine.",
    excerpt:
      "The appeal focuses on emergency care, primary care continuity, preparedness and medical evacuation.",
    publishedAt: "2026-02-06T09:40:00.000Z",
    updatedAt: "2026-02-06T09:40:00.000Z",
    author: "WHO Europe",
    tags: ["humanitarian", "support", "policy"],
    body: [
      "WHO's February 6, 2026 appeal requested US$42 million to protect care access for 700,000 people as the war entered its fifth year.",
      "The organization said ongoing hostilities, repeated attacks on civilian infrastructure and displacement continue to strain service delivery across the country.",
      "In editorial terms, this is a strong institutional marker for current humanitarian health priorities in Ukraine."
    ],
    sourceUrl:
      "https://www.who.int/europe/news/item/06-02-2026-ukraine--who-seeks-us-42-million-in-2026-to-protect-health-care-as-war-enters-its-fifth-year",
    imageUrl:
      "https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Medical response and humanitarian appeal",
    status: "published"
  },
  {
    id: "preview-news-9",
    type: "news",
    slug: "uk-announces-500-million-plus-air-defence-package-for-ukraine",
    title: "UK announces air-defence package for Ukraine worth more than £500 million",
    description:
      "The UK said on February 12, 2026 it would provide a new air-defence package including funding for NATO PURL and additional missiles.",
    excerpt:
      "The announcement linked urgent delivery needs to protection of Ukrainian infrastructure and cities.",
    publishedAt: "2026-02-12T15:45:00.000Z",
    updatedAt: "2026-02-12T15:45:00.000Z",
    author: "GOV.UK",
    tags: ["support", "policy", "energy"],
    body: [
      "The UK government said the package included £150 million for NATO's PURL initiative and additional UK-manufactured missiles for Ukraine.",
      "The release explicitly framed the package as a response to attacks on energy sites, homes and other infrastructure.",
      "This belongs high in the feed because it is a concrete, recent support announcement with clear operational detail."
    ],
    sourceUrl:
      "https://www.gov.uk/government/news/uk-announces-urgent-new-air-defence-package-for-ukraine-worth-over-half-a-billion-pounds",
    imageUrl:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Air-defence and security support briefing",
    status: "published"
  },
  {
    id: "preview-news-10",
    type: "news",
    slug: "uk-highlights-humanitarian-winter-support-for-ukraine",
    title: "UK highlights humanitarian winter support for Ukraine",
    description:
      "A February 6, 2026 UK government release said UK-funded support had helped more than 1 million Ukrainians affected by the winter energy crisis.",
    excerpt:
      "The update focused on generators, hygiene kits and support to restore water and heating.",
    publishedAt: "2026-02-06T10:30:00.000Z",
    updatedAt: "2026-02-06T10:30:00.000Z",
    author: "GOV.UK",
    tags: ["humanitarian", "support", "energy"],
    body: [
      "The UK government said its support had reached more than 1 million Ukrainians affected by winter energy disruption, with help including generators, hygiene kits and assistance to restore heat and water.",
      "The release tied humanitarian support directly to the practical effects of strikes on infrastructure during severe winter conditions.",
      "This is useful for the site because it offers a concrete humanitarian support story rather than only military or diplomatic updates."
    ],
    sourceUrl:
      "https://www.gov.uk/government/news/uk-provides-vital-humanitarian-support-as-ukraine-suffers-through-brutal-winter",
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Humanitarian winter support delivery",
    status: "published"
  },
  {
    id: "preview-blog-1",
    type: "blog",
    slug: "how-to-structure-a-ukraine-support-newsroom",
    title: "How to structure a Ukraine support newsroom for speed and trust",
    description:
      "A practical editorial framework for publishing fast without drifting into noise, duplication, or weak sourcing.",
    excerpt:
      "A small publishing team can stay disciplined by separating ingestion, rewrite, image generation, and final publish review.",
    publishedAt: "2026-02-25T08:00:00.000Z",
    updatedAt: "2026-02-25T08:00:00.000Z",
    author: "Editorial Desk",
    tags: ["policy", "support"],
    body: [
      "A reliable newsroom flow starts with disciplined inputs. Sources need to be curated, logged, and reviewed on a predictable cadence rather than pulled ad hoc from noisy channels.",
      "The second layer is editorial transformation. Rewrites should keep attribution explicit, strip out duplication, and preserve only what the source can support.",
      "Finally, publication needs a visible standard. A site that explains how it reviews source material is easier to trust, easier to improve, and easier to scale."
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Editorial planning desk",
    status: "published",
    featured: true
  },
  {
    id: "preview-blog-2",
    type: "blog",
    slug: "what-makes-a-good-support-page",
    title: "What makes a support page actually useful",
    description:
      "Donation and support pages fail when they are vague. They work when they reduce hesitation and tell the user exactly what comes next.",
    excerpt:
      "Clarity, transparency, and a short path to action matter more than decorative copy.",
    publishedAt: "2026-02-24T12:00:00.000Z",
    updatedAt: "2026-02-24T12:00:00.000Z",
    author: "Editorial Desk",
    tags: ["support", "humanitarian"],
    body: [
      "The strongest support pages answer three questions immediately: where help goes, what kind of support is needed, and how frequently the page is updated.",
      "Users hesitate when a site makes them infer too much. Simple structure, source links, and clear topic groupings outperform overloaded layouts.",
      "The result is not just better conversion. It is a more credible product."
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Donation and support planning notes",
    status: "published"
  },
  {
    id: "preview-blog-3",
    type: "blog",
    slug: "why-topic-pages-matter-for-an-advocacy-site",
    title: "Why topic pages matter for an advocacy-driven news site",
    description:
      "Topic archives do more than help SEO. They also make the site easier to trust, browse, and cite.",
    excerpt:
      "A topic page is where scattered updates become navigable context.",
    publishedAt: "2026-02-23T08:30:00.000Z",
    updatedAt: "2026-02-23T08:30:00.000Z",
    author: "Editorial Desk",
    tags: ["policy", "diplomacy"],
    body: [
      "A strong topic page reduces the cost of understanding. Instead of forcing readers to reconstruct context from isolated headlines, it groups reporting into a stable reference point.",
      "That structure also helps internal linking, related-story discovery, and clearer metadata across the site.",
      "In practice, topic pages are part content product and part information architecture."
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Structured topic mapping and editorial planning",
    status: "published"
  },
  {
    id: "preview-blog-4",
    type: "blog",
    slug: "how-to-evaluate-donation-links-without-hype",
    title: "How to evaluate donation links without hype",
    description:
      "A short framework for deciding whether a support recommendation is credible enough to publish.",
    excerpt:
      "The standard should be source transparency, update recency, and a clear explanation of where support goes.",
    publishedAt: "2026-02-22T11:45:00.000Z",
    updatedAt: "2026-02-22T11:45:00.000Z",
    author: "Editorial Desk",
    tags: ["support", "policy"],
    body: [
      "Not every support link deserves publication. At minimum, readers should be able to see who operates it, what it funds, and whether the information is still current.",
      "That baseline reduces reputational risk and helps the site avoid performative recommendations that do not actually help users act.",
      "The editorial rule is simple: publish fewer links, but make them stronger."
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Evaluating donation and funding information",
    status: "published"
  },
  {
    id: "preview-blog-5",
    type: "blog",
    slug: "building-a-recovery-coverage-calendar",
    title: "Building a recovery coverage calendar that stays useful",
    description:
      "Recovery reporting improves when editors plan around delivery milestones, not just headline spikes.",
    excerpt:
      "A calendar built around funding, procurement, repairs, and implementation tells a more honest story.",
    publishedAt: "2026-02-21T07:15:00.000Z",
    updatedAt: "2026-02-21T07:15:00.000Z",
    author: "Editorial Desk",
    tags: ["recovery", "policy"],
    body: [
      "Recovery is easy to cover superficially and harder to cover well. The best editorial calendars follow project phases rather than waiting for isolated announcements.",
      "That means watching procurement, contract awards, repair starts, delivery checkpoints, and handover milestones.",
      "The reward is better continuity and better accountability."
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Recovery planning calendar and editorial workflow",
    status: "published"
  }
];

function sortEntries(entries: ContentEntry[]) {
  return [...entries].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPreviewEntries() {
  return sortEntries(previewEntries);
}

export function getPreviewTopics() {
  return [...previewTopics].sort((a, b) => a.tag.localeCompare(b.tag));
}
