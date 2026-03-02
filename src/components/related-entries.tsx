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
            className="rounded-2xl border border-line bg-mist p-5 transition hover:border-brand hover:bg-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              {entry.type}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink">{entry.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{entry.excerpt}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}

