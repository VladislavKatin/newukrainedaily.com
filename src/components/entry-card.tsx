import Image from "next/image";
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
  const previewUrl = entry.previewImageUrl || entry.imageUrl;
  const previewAlt = entry.previewImageAlt || entry.imageAlt || entry.title;

  return (
    <article className="panel overflow-hidden p-6">
      {previewUrl ? (
        <Link
          href={`/${entry.type}/${entry.slug}`}
          className="mb-5 block overflow-hidden rounded-2xl border border-line bg-mist"
        >
          <Image
            src={previewUrl}
            alt={previewAlt}
            width={1200}
            height={675}
            className="h-32 w-full object-cover transition duration-300 hover:scale-[1.02] sm:h-36"
          />
        </Link>
      ) : null}
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <span>{entry.type}</span>
        <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{entry.title}</h2>
      <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
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
