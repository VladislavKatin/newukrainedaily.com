import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Editorial Policy",
  description:
    "Editorial policy for sourcing, attribution, corrections, AI disclosures, image standards, and article maintenance at New Ukraine Daily.",
  path: "/editorial-policy",
  imagePath: "/og-editorial-policy.svg",
  imageAlt: "New Ukraine Daily editorial policy"
});

const principles = [
  "Facts come before tone, speed, and volume.",
  "Attribution stays visible in the article, not hidden in internal metadata.",
  "Headlines should match the actual angle of the reporting.",
  "Real source photos and AI illustrations are treated differently and labeled clearly.",
  "Older articles are repaired when formatting, metadata, or editorial quality falls below standard."
];

const correctionRules = [
  "Material factual errors are corrected as quickly as possible after verification.",
  "Clarifications are made when wording is technically true but too broad, vague, or misleading.",
  "Routine copy edits may be made without a formal note when they do not change meaning.",
  "Substantive factual changes are treated as editorial maintenance, not silent cleanup."
];

export default function EditorialPolicyPage() {
  return (
    <>
      <PageShell
        eyebrow="Policy"
        title="Editorial Policy"
        description="This page explains how New Ukraine Daily handles sourcing, article framing, corrections, AI disclosures, image treatment, and ongoing newsroom maintenance."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Core Standard</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Built for clear, defensible reporting on Ukraine
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                New Ukraine Daily is designed to publish English-language reporting on Ukraine that is factual, readable, and transparent about what is known, who reported it, and what remains uncertain.
              </p>
              <p>
                The newsroom does not treat policy pages as boilerplate. These rules shape how headlines are written, how articles are repaired, how images are labeled, and how readers move through related coverage.
              </p>
              <p>
                The standard is simple: every story should be easier to understand, better attributed, and more useful after editorial review than it was at raw input stage.
              </p>
            </div>
          </article>

          <aside className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Policy Snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Reader-facing rules
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {principles.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Sourcing And Attribution</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              What every report should make clear
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                News reports should state what happened, when it happened, where it happened, and who reported it as early as possible. Source attribution should remain visible to the reader when a story relies on an agency report, official statement, government release, or public institutional source.
              </p>
              <p>
                The site aims to avoid unsupported synthesis, vague collective claims, and filler language that makes a report sound broader or more certain than the source material supports.
              </p>
            </div>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Headlines And Framing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Headlines should match the fresh angle, not manufacture urgency
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Headlines should reflect the actual current angle of the story. They should not exaggerate routine developments, recycle old trends as if they were breaking, or overstate certainty where the reporting is still developing.
              </p>
              <p>
                When the source angle is weak, generic, or misleading, the newsroom may tighten or normalize the headline so it better reflects the verified facts.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Corrections And Updates</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              How errors and clarifications are handled
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
              {correctionRules.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              Readers who want to report an issue should use the <Link href="/contact" className="font-semibold text-ink underline decoration-line underline-offset-4">contact page</Link> and include the URL, disputed line, and supporting public source whenever possible.
            </p>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Images And AI Disclosures</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Real photos and AI illustrations are not treated as the same thing
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Real source images should remain clearly attributable as source or agency photos. AI-generated visuals should be labeled as illustrations and should never be presented as documentary photography.
              </p>
              <p>
                Technical pipeline captions should not appear in the visible article. Readers should see clean editorial labels such as <strong className="text-ink">Photo: [Source]</strong> or a clear illustration disclosure.
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Archive Maintenance</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Older articles are maintained, not left to decay
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                The newsroom treats archive maintenance as part of editorial quality. Older stories may be repaired when they have weak formatting, thin leads, technical captions, duplicate image blocks, broken metadata, or poor internal linking.
              </p>
              <p>
                This does not mean facts are rewritten casually. It means the presentation, structure, and clarity of the article can be improved while preserving the factual meaning of the report.
              </p>
            </div>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Related Pages</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Trust and newsroom references
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                Read <Link href="/about" className="font-semibold text-ink underline decoration-line underline-offset-4">About</Link> for mission and coverage priorities.
              </p>
              <p>
                Read <Link href="/newsroom" className="font-semibold text-ink underline decoration-line underline-offset-4">Newsroom</Link> for desk structure and editorial workflow.
              </p>
              <p>
                Read <Link href="/corrections" className="font-semibold text-ink underline decoration-line underline-offset-4">Corrections</Link> for how factual fixes and clarifications are handled.
              </p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
