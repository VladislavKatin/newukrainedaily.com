import Image from "next/image";
import Link from "next/link";
import type { ContentEntry } from "@/lib/content-types";

export function RelatedEntries({
  title,
  entries
}: {
  title: string;
  entries: ContentEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <aside className="mt-10 border-t border-line pt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-6 grid gap-4">
        {entries.map((entry) => (
          <Link
            key={`${entry.type}-${entry.slug}`}
            href={`/${entry.type}/${entry.slug}`}
            className="overflow-hidden rounded-2xl border border-line bg-mist transition hover:border-brand hover:bg-white"
          >
            {entry.imageUrl ? (
              <div className="border-b border-line bg-white">
                <Image
                  src={entry.imageUrl}
                  alt={entry.imageAlt || entry.title}
                  width={1200}
                  height={675}
                  className="h-28 w-full object-cover sm:h-32"
                />
              </div>
            ) : null}
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                {entry.type}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{entry.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
