import Link from "next/link";

const trustItems = [
  {
    eyebrow: "Newsroom",
    title: "Edited from Zaporizhzhia",
    description: "See where the newsroom works in southern Ukraine and how proximity to the war shapes coverage.",
    href: "/contact"
  },
  {
    eyebrow: "Standards",
    title: "Editorial policy",
    description: "Review sourcing, image, correction, and archive-maintenance rules across the site.",
    href: "/editorial-policy"
  },
  {
    eyebrow: "Trust",
    title: "Corrections and updates",
    description: "Check how factual corrections, clarifications, and article repairs are handled.",
    href: "/corrections"
  }
];

export function TrustBar() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {trustItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="panel p-5 transition hover:border-brand hover:bg-white sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{item.eyebrow}</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">{item.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
        </Link>
      ))}
    </section>
  );
}
