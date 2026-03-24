import Link from "next/link";

const trustItems = [
  {
    title: "Editorial standards",
    description: "Clear sourcing, attribution, updates, and corrections across every article.",
    href: "/editorial-policy"
  },
  {
    title: "Newsroom and masthead",
    description: "See how the publication is structured and where editorial requests are handled.",
    href: "/newsroom"
  },
  {
    title: "Corrections and updates",
    description: "Report an issue, request a correction, or review how updates are handled.",
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Trust</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">{item.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
        </Link>
      ))}
    </section>
  );
}
