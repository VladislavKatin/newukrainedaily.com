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

type EntryCardProps = {
  entry: ContentEntry;
  compact?: boolean;
};

export function EntryCard({ entry, compact = false }: EntryCardProps) {
  const previewUrl = entry.previewImageUrl || entry.imageUrl;
  const previewAlt = entry.previewImageAlt || entry.imageAlt || entry.title;

  return (
    <article className={`panel overflow-hidden ${compact ? "p-4 sm:p-5" : "p-6"}`}>
      {previewUrl ? (
        <Link
          href={`/${entry.type}/${entry.slug}`}
          className={`mb-4 block overflow-hidden rounded-2xl border border-line bg-mist ${
            compact ? "aspect-[16/9]" : ""
          }`}
        >
          <Image
            src={previewUrl}
            alt={previewAlt}
            width={1200}
            height={675}
            sizes={
              compact
                ? "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            }
            className={`w-full object-cover transition duration-300 hover:scale-[1.02] ${
              compact ? "h-full" : "h-32 sm:h-36"
            }`}
          />
        </Link>
      ) : null}
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <span>{entry.type}</span>
        <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
      </div>
      <h2 className={`mt-3 font-semibold tracking-tight text-ink ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
        {entry.title}
      </h2>
      <p className={`mt-2 text-sm text-slate-600 ${compact ? "line-clamp-3 leading-5" : "line-clamp-4 leading-6"}`}>
        {entry.excerpt}
      </p>
      <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "hidden sm:flex" : ""}`}>
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
        className={`inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand ${compact ? "mt-4" : "mt-6"}`}
      >
        Read more
      </Link>
    </article>
  );
}
