import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { getAllTags, getEntriesByTypePage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildMetadata({
  title: "Home",
  description:
    "Latest Ukraine news, practical support guidance, and topic pages tracking diplomacy, aid, security, and recovery.",
  path: "/"
});

export default async function HomePage() {
  const [latestNewsPage, topics] = await Promise.all([
    getEntriesByTypePage("news", { limit: 24, offset: 0 }),
    getAllTags()
  ]);

  const freshWindowMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const freshNews = latestNewsPage.entries.filter(
    (entry) => now - new Date(entry.publishedAt).getTime() <= freshWindowMs
  );
  const latestNews = (freshNews.length > 0 ? freshNews : latestNewsPage.entries).slice(0, 6);
  const latestNewsUpdatedAt = latestNews[0]?.publishedAt ?? null;

  return (
    <div className="container-shell py-12 sm:py-16">
      <section className="panel p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          newukrainedaily.com
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Daily reporting on Ukraine, with clear context and practical support guidance.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
          New Ukraine Daily combines breaking developments, issue-by-issue topic pages, and
          useful guides on how to support Ukraine without losing sight of facts, context, or
          accountability.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/news"
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand"
          >
            Latest News
          </Link>
          <Link
            href="/donate"
            className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
          >
            Support Ukraine
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
              Latest News
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
              New updates (max 6)
            </h2>
            {latestNewsUpdatedAt ? (
              <p className="mt-2 text-sm text-slate-500">
                Last update: {new Date(latestNewsUpdatedAt).toLocaleString("en-US")}
              </p>
            ) : null}
          </div>
          <Link href="/news" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {latestNews.length > 0 ? (
            latestNews.map((entry) => <EntryCard key={entry.slug} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published news is available right now.
            </div>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
            Support Ukraine
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Ways to help
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Support is most useful when it is specific, transparent, and steady. These are the
            areas where readers, donors, and partner organizations can make a practical difference.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Emergency relief campaigns and winter aid",
              "Medical support and rehabilitation programs",
              "Support for schools, children, and families",
              "Independent journalism and fact-checking",
              "Local recovery and rebuilding initiatives",
              "Legal, psychological, and social assistance"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-mist p-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Topics</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Browse by topic</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Follow recurring themes across the site, including frontline developments, diplomacy,
            humanitarian support, reconstruction, and energy security.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {topics.length > 0 ? (
              topics.slice(0, 12).map((tag) => (
                <Link
                  key={tag}
                  href={`/topic/${tag}`}
                  className="truncate rounded-lg bg-sky px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-brand hover:text-white"
                >
                  #{tag}
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                Topics will appear here after the first published items are indexed.
              </p>
            )}
          </div>
          {topics.length > 12 ? (
            <Link href="/news" className="mt-5 inline-block text-sm font-semibold text-brand">
              Browse all topics in news archive
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
