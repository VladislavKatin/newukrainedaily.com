import Link from "next/link";

type ArticleOverviewProps = {
  title?: string;
  keyPoints?: string[];
  whyItMatters?: string;
  sourceUrl?: string;
};

export function ArticleOverview({
  title = "At a glance",
  keyPoints = [],
  whyItMatters,
  sourceUrl
}: ArticleOverviewProps) {
  const points = keyPoints.filter(Boolean).slice(0, 5);

  if (points.length === 0 && !whyItMatters) {
    return null;
  }

  return (
    <section className="mt-7 rounded-3xl border border-line bg-mist/80 p-5 sm:mt-8 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{title}</p>
          {points.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700 sm:text-[0.97rem]">
              {points.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-brand" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-2xl border border-line bg-white/80 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Why it matters</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            {whyItMatters || "This report is structured to surface the main facts quickly and keep the supporting context easy to scan."}
          </p>
          {sourceUrl ? (
            <div className="mt-4">
              <Link href={sourceUrl} className="text-sm font-semibold text-brand underline decoration-brand/40 underline-offset-4">
                View source reporting reference
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
