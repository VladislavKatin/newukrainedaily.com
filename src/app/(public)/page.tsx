import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { NewsletterCta } from "@/components/newsletter-cta";
import { TrustBar } from "@/components/trust-bar";
import { getAllTags, getEntriesByTypePage } from "@/lib/content";
import { curateHomepageNews } from "@/lib/homepage-curation";
import { buildMetadata } from "@/lib/seo";
import { SUPPORTED_TOPICS, topicSlugFromLabel } from "@/lib/topic-taxonomy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildMetadata({
  title: "Home",
  description:
    "Latest Ukraine news, explainers, analysis, and practical support coverage organized for readers who need fast facts, clear context, and visible trust signals.",
  path: "/"
});

const trustHighlights = [
  "Edited from Zaporizhzhia, Ukraine",
  "Roughly 20 km from active fighting",
  "Visible corrections and newsroom standards"
];

export default async function HomePage() {
  const [latestNewsPage, latestBlogPage, topics] = await Promise.all([
    getEntriesByTypePage("news", { limit: 24, offset: 0 }),
    getEntriesByTypePage("blog", { limit: 6, offset: 0 }),
    getAllTags()
  ]);

  const freshWindowMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const freshNews = latestNewsPage.entries.filter(
    (entry) => now - new Date(entry.publishedAt).getTime() <= freshWindowMs
  );
  const candidateNews = freshNews.length > 0 ? freshNews : latestNewsPage.entries;
  const { leadStory, developingNow, topStories, latestRail } = curateHomepageNews(candidateNews);
  const latestExplainers = latestBlogPage.entries.slice(0, 3);
  const editorsPicks = latestBlogPage.entries.slice(0, 2);
  const getEntrySummary = (entry: { excerpt?: string; lead?: string; description: string }) =>
    entry.excerpt || entry.lead || entry.description;
  const topicIndex = new Map(topics.map((tag) => [tag.toLowerCase(), tag]));
  const curatedTopics = SUPPORTED_TOPICS.map((topic) => topicIndex.get(topic.toLowerCase()))
    .filter((tag): tag is string => Boolean(tag))
    .slice(0, 8);

  return (
    <div className="container-shell py-8 sm:py-16">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[28px] border border-line bg-[#f8fbff] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 sm:text-xs">
            {trustHighlights.map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-line bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p className="max-w-xl leading-7">
              New Ukraine Daily is built as a maintained newsroom product, not just a news feed.
            </p>
            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/newsroom" className="text-brand transition hover:text-ink">
                Newsroom
              </Link>
              <Link href="/editorial-policy" className="text-brand transition hover:text-ink">
                Editorial Policy
              </Link>
              <Link href="/contact" className="text-brand transition hover:text-ink">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="panel p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Lead Story</p>
          {leadStory ? (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                <span>{leadStory.storyFormat || "News"}</span>
                {leadStory.readingTimeMinutes ? <span>{leadStory.readingTimeMinutes} min read</span> : null}
                <span>{new Date(leadStory.publishedAt).toLocaleDateString("en-US")}</span>
                <span>{leadStory.author}</span>
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
                {leadStory.title}
              </h1>
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-8">
                {leadStory.lead || leadStory.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/news/${leadStory.slug}`}
                  className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand"
                >
                  Read the lead story
                </Link>
                <Link
                  href="/news"
                  className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
                >
                  Open the news desk
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm leading-7 text-slate-600">No published news is available right now.</div>
          )}
        </div>
        <div className="grid gap-4">
          <div className="panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Why readers return</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>Fast factual leads instead of padded copy.</li>
              <li>Related coverage that keeps readers inside the story.</li>
              <li>Topic hubs for diplomacy, aid, energy, security, and recovery.</li>
              <li>Support reporting that explains where help matters most.</li>
            </ul>
          </div>
          <div className="panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Why trust this site</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <p>
                The newsroom publishes from Zaporizhzhia, maintains visible corrections, and keeps sourcing and image treatment open to readers.
              </p>
              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                <Link href="/about" className="text-brand transition hover:text-ink">
                  About
                </Link>
                <Link href="/corrections" className="text-brand transition hover:text-ink">
                  Corrections
                </Link>
                <Link href="/contact" className="text-brand transition hover:text-ink">
                  Zaporizhzhia contact
                </Link>
              </div>
            </div>
          </div>
          <NewsletterCta compact sourcePage="home" />
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] sm:mt-16">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Developing Now</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Fast-moving story lines</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            {developingNow.map((entry) => (
              <Link key={entry.slug} href={`/news/${entry.slug}`} className="rounded-2xl border border-line bg-white p-4 transition hover:border-brand hover:bg-mist">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <span>{entry.storyFormat || "News"}</span>
                  {entry.readingTimeMinutes ? <span>{entry.readingTimeMinutes} min read</span> : null}
                  <span>{new Date(entry.publishedAt).toLocaleDateString("en-US")}</span>
                </div>
                <h3 className="mt-2 text-lg font-semibold leading-7 text-ink">{entry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{getEntrySummary(entry)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Top Stories</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                The news desk at a glance
              </h2>
            </div>
            <Link href="/news" className="text-sm font-semibold text-brand">View all news</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topStories.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] sm:mt-16">
        <div className="panel p-5 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Latest</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Fast updates</h2>
            </div>
            <Link href="/news" className="text-sm font-semibold text-brand">Open the news desk</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {latestRail.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} compact />
            ))}
          </div>
        </div>
        <div className="panel p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Analysis and Explainers</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Context beyond the headlines
          </h2>
          <div className="mt-6 grid gap-4">
            {latestExplainers.map((entry) => (
              <Link key={entry.slug} href={`/blog/${entry.slug}`} className="rounded-2xl border border-line bg-white p-4 transition hover:border-brand hover:bg-mist sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  <span>{entry.storyFormat || "Explainer"}</span>
                  {entry.readingTimeMinutes ? <span className="text-slate-500">{entry.readingTimeMinutes} min read</span> : null}
                </div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">{entry.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{getEntrySummary(entry)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr] sm:mt-16">
        <div className="panel p-5 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Editor&apos;s Picks</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Start here if you want the deeper read
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-brand">Open explainers</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {editorsPicks.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} compact />
            ))}
          </div>
        </div>
        <div className="panel p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Reader path</p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>Start with the lead story for the top confirmed angle.</p>
            <p>Move to Developing Now if you want the fastest live threads.</p>
            <p>Use Editor&apos;s Picks when the headline needs more context, policy background, or support reporting.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] sm:mt-16">
        <div className="panel p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Topic Hubs</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Follow the core themes
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The site is strongest when readers can move from fast updates into recurring coverage areas with clear context and cleaner archives.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {curatedTopics.map((tag) => (
              <Link
                key={tag}
                href={`/topic/${topicSlugFromLabel(tag)}`}
                className="rounded-2xl border border-line bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:border-brand hover:bg-mist"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
        <TrustBar />
      </section>
    </div>
  );
}
