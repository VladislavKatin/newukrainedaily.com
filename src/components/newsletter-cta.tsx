import Link from "next/link";

export function NewsletterCta({
  title = "Get the daily Ukraine briefing",
  description = "Receive the key developments, major policy moves, and support reporting in one concise daily note.",
  compact = false
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <section className={`panel ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Newsletter</p>
      <h2 className={`mt-3 font-semibold tracking-tight text-ink ${compact ? "text-2xl" : "text-3xl"}`}>
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="mailto:vladkatintam@gmail.com?subject=Daily%20Ukraine%20Briefing"
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand"
        >
          Request the briefing
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
        >
          Contact the newsroom
        </Link>
      </div>
    </section>
  );
}
