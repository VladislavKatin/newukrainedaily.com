import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "About New Ukraine Daily, an English-language newsroom edited from Zaporizhzhia, Ukraine, with a focus on factual reporting, accountability, and useful coverage.",
  path: "/about",
  imagePath: "/og-about.svg",
  imageAlt: "About New Ukraine Daily"
});

const coverageAreas = [
  "Frontline developments and daily security updates",
  "Diplomacy, sanctions, and international policy toward Ukraine",
  "Energy infrastructure, blackouts, and repair work",
  "Aid, reconstruction, and humanitarian impact",
  "Accountability, war-crime reporting, and public-interest oversight"
];

const standards = [
  "Clear sourcing and visible attribution in every report",
  "Short factual leads that tell readers what happened, where, when, and who said it",
  "Corrections and updates handled as visible editorial maintenance, not hidden cleanup",
  "Limited topic focus so the site stays useful for readers following Ukraine closely",
  "Structured internal linking so each article helps readers move through the story, not hit dead ends"
];

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About"
        title="About New Ukraine Daily"
        description="New Ukraine Daily is an English-language digital newsroom focused on Ukraine. It is built to make fast-moving reporting clearer, easier to scan, and more useful to international readers who need both facts and context."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Newsroom Context</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Edited from Zaporizhzhia, close to the war in southern Ukraine
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                New Ukraine Daily is edited from <strong>Zaporizhzhia, Ukraine</strong>. The newsroom works from a city that sits close to the war, with the editorial base operating roughly <strong>20 kilometers from active fighting</strong>.
              </p>
              <p>
                That matters because proximity shapes judgment. It affects how the newsroom thinks about urgency, source quality, what deserves prominence, and what should never be padded into low-value content.
              </p>
              <p>
                The publication is designed for readers who want a fast factual lead, visible sourcing, usable internal navigation, and enough context to understand why a development matters without wading through generic filler.
              </p>
            </div>
          </article>

          <aside className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Editorial Mission</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              What the site is trying to do
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                The goal is straightforward: publish English-language Ukraine coverage that reads like edited reporting, not like automated summary churn.
              </p>
              <p>
                Daily news is kept tight and factual. Longer explainers focus on policy, aid, reconstruction, energy, and accountability. The newsroom does not try to be a general-interest outlet. It stays narrow on purpose.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/newsroom"
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                View the newsroom
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
              >
                Contact the desk
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Coverage Priorities</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              What New Ukraine Daily covers most closely
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {coverageAreas.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Standards</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Editorial rules readers should expect
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {standards.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Why This Structure Exists</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Built for readers who want useful reporting, not content volume
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                The site is structured to reduce the common weaknesses of low-trust news surfaces: duplicate angles, over-smoothed copy, weak archive pages, broken internal paths, and articles that say little beyond a source headline.
              </p>
              <p>
                That is why the newsroom puts unusual weight on cleanup, source review, internal linking, repair of older articles, and visible trust pages. Those are not side features. They are part of the product.
              </p>
            </div>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Reader Paths</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Where to go next
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Use the <Link href="/newsroom" className="font-semibold text-ink underline decoration-line underline-offset-4">newsroom page</Link> to see how coverage is organized.
              </p>
              <p>
                Use the <Link href="/editorial-policy" className="font-semibold text-ink underline decoration-line underline-offset-4">editorial policy</Link> page for sourcing and corrections standards.
              </p>
              <p>
                Use the <Link href="/contact" className="font-semibold text-ink underline decoration-line underline-offset-4">contact page</Link> for corrections, questions, and direct newsroom communication from Zaporizhzhia.
              </p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
