import type { ContentEntry } from "@/lib/content-types";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function ArticleStatusBanner({ entry }: { entry: ContentEntry }) {
  if (!(entry.storyFormat === "Breaking" || entry.storyFormat === "Update")) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-brand/20 bg-sky px-4 py-4 text-sm leading-6 text-slate-700 sm:mt-8 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Developing story</p>
      <p className="mt-2">
        This page is updated as verified details move. The lead and top sections are tightened first when the clearest confirmed angle changes.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        <span>Published {formatDate(entry.publishedAt)}</span>
        {entry.updatedAt ? <span>Updated {formatDate(entry.updatedAt)}</span> : null}
      </div>
    </div>
  );
}