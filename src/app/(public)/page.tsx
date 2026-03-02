import Link from "next/link";
import { EntryCard } from "@/components/entry-card";
import { getAllTags, getEntriesByType } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Home",
  description:
    "SEO-first homepage with placeholders for latest news, support pathways, topics, and reports.",
  path: "/"
});

export default async function HomePage() {
  const [latestNews, reports, topics] = await Promise.all([
    getEntriesByType("news"),
    getEntriesByType("blog"),
    getAllTags()
  ]);

  return (
    <div className="container-shell py-12 sm:py-16">
      <section className="panel p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">
          SEO Publishing Starter
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Built for fast content, clean metadata, and future automation.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
          This starter separates breaking news from blog content, keeps pages lightweight, and
          ships with cron-ready API routes for future ingestion and publishing workflows.
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
              News pipeline placeholder
            </h2>
          </div>
          <Link href="/news" className="text-sm font-semibold text-brand">
            View all
          </Link>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {latestNews.length > 0 ? (
            latestNews.map((entry) => <EntryCard key={entry.slug} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published news is available yet. Connect the database and run the ingestion
              pipeline to populate this section.
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
            Donation and action hub placeholder
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Emergency relief campaigns",
              "Medical aid partners",
              "Independent journalism support",
              "Recovery and rebuilding funds"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-mist p-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Topics</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Topic archives</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {topics.length > 0 ? (
              topics.map((tag) => (
                <Link
                  key={tag}
                  href={`/topic/${tag}`}
                  className="rounded-full bg-sky px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand hover:text-white"
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
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Reports</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
              Blog and report placeholder
            </h2>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-brand">
            View blog
          </Link>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {reports.length > 0 ? (
            reports.map((entry) => <EntryCard key={entry.slug} entry={entry} />)
          ) : (
            <div className="panel p-6 text-sm leading-6 text-slate-600">
              No published blog posts are available yet. Add content in the database to activate
              this archive.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
