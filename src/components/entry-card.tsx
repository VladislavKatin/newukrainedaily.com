import Link from "next/link";
import type { ContentEntry } from "@/lib/content-types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function EntryCard({ entry }: { entry: ContentEntry }) {
  return (
    <article className="panel p-6">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <span>{entry.type}</span>
        <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{entry.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <Link
            key={tag}
            href={`/topic/${tag}`}
            className="rounded-full bg-sky px-3 py-1 text-xs font-medium text-slate-700"
          >
            #{tag}
          </Link>
        ))}
      </div>
      <Link
        href={`/${entry.type}/${entry.slug}`}
        className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand"
      >
        Read more
      </Link>
    </article>
  );
}
