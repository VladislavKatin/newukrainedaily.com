import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Newsroom",
  description:
    "Newsroom structure, editorial desks, standards, and contact paths for New Ukraine Daily in Zaporizhzhia, Ukraine.",
  path: "/newsroom"
});

const desks = [
  [
    "Daily News Desk",
    "Breaking developments, frontline reporting, air attack updates, security coverage, and fast-turnaround news briefs on Ukraine."
  ],
  [
    "Analysis Desk",
    "Explainers, policy context, sanctions coverage, energy reporting, and longer reads that help readers understand what changes and why."
  ],
  [
    "Standards and Maintenance",
    "Corrections, archive repair, attribution review, duplicate cleanup, and editorial checks on article quality and trust signals."
  ],
  [
    "Aid and Recovery Coverage",
    "Reporting on humanitarian needs, reconstruction, practical support journalism, and the civic and economic side of Ukraine&apos;s recovery."
  ]
];

const workflow = [
  "Source review and relevance checks before publication",
  "Factual lead and headline cleanup so the main angle is clear immediately",
  "Image handling that separates real source photos from AI illustrations",
  "Related coverage and topic linking so readers can move deeper into a story",
  "Repair of older articles when formatting, clarity, or metadata falls below standard"
];

export default function NewsroomPage() {
  return (
    <>
      <PageShell
        eyebrow="Newsroom"
        title="Newsroom and Editorial Desk"
        description="New Ukraine Daily is organized as a small digital newsroom. It combines fast reporting, explainers, standards review, and ongoing archive maintenance for readers following Ukraine closely."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Operating Context</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              A newsroom working from Zaporizhzhia, Ukraine
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                New Ukraine Daily is edited from <strong>Zaporizhzhia</strong>, a major city in southeastern Ukraine. The newsroom operates close to the war, with the editorial base working roughly <strong>20 kilometers from active fighting</strong>.
              </p>
              <p>
                That proximity shapes the desk priorities. The newsroom is built to publish useful, defensible reporting on security, diplomacy, energy, aid, and recovery without drifting into weak filler or low-value archive clutter.
              </p>
              <p>
                The site is small by design. That makes discipline more important: stronger topic focus, clearer attribution, faster cleanup, and visible trust pages that explain how the publication works.
              </p>
            </div>
          </article>

          <aside className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Reach The Desk</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              The fastest path for corrections and editorial questions
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                For corrections, article questions, source notes, or partnership requests, use the main newsroom contact address listed on the contact page.
              </p>
              <p>
                The fastest way to resolve an issue is to include the exact article URL and a direct explanation of what needs review.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                Contact the newsroom
              </Link>
              <Link
                href="/corrections"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
              >
                Corrections policy
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {desks.map(([title, description]) => (
            <article key={title} className="panel p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Desk</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Editorial Workflow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              What the newsroom is responsible for after a story is written
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {workflow.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Why This Matters</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Built as a newsroom, not a feed
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                The publication is designed around editorial maintenance as much as publication speed. That means improving older articles, cleaning weak metadata, fixing broken formatting, and keeping related coverage usable instead of letting the archive decay.
              </p>
              <p>
                Readers should be able to trust that the site is maintained like a working newsroom product, not left as a pile of disconnected posts.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Editorial Scope</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              The areas this newsroom follows most closely
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Frontline and security",
                "Air attacks and air defense",
                "Diplomacy and peace talks",
                "Sanctions and accountability",
                "Energy infrastructure",
                "Aid and reconstruction"
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-mist px-4 py-3 text-sm font-medium text-ink">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Useful Pages</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Trust and standards links
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Read the <Link href="/about" className="font-semibold text-ink underline decoration-line underline-offset-4">about page</Link> for mission and coverage priorities.
              </p>
              <p>
                Read the <Link href="/editorial-policy" className="font-semibold text-ink underline decoration-line underline-offset-4">editorial policy</Link> for sourcing, formatting, and quality standards.
              </p>
              <p>
                Read the <Link href="/contact" className="font-semibold text-ink underline decoration-line underline-offset-4">contact page</Link> for direct newsroom communication from Zaporizhzhia.
              </p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}


