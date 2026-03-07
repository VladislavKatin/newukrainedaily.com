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
    <aside className="mt-8 border-t border-line pt-6 sm:mt-10 sm:pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4">
        {entries.map((entry) => (
          <Link
            key={`${entry.type}-${entry.slug}`}
            href={`/${entry.type}/${entry.slug}`}
            className="overflow-hidden rounded-2xl border border-line bg-mist transition hover:border-brand hover:bg-white sm:grid sm:grid-cols-[168px_1fr]"
          >
            {entry.imageUrl ? (
              <div className="border-b border-line bg-white sm:border-b-0 sm:border-r">
                <Image
                  src={entry.imageUrl}
                  alt={entry.imageAlt || entry.title}
                  width={1200}
                  height={675}
                  sizes="(max-width: 640px) 100vw, 168px"
                  className="h-24 w-full object-cover sm:h-full"
                />
              </div>
            ) : null}
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                {entry.type}
              </p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-ink sm:text-lg">
                {entry.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
