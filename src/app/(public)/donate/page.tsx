import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate to Support Ukraine",
  description:
    "A clear, practical donation guide focused on impact, transparency, and long-term support for Ukraine.",
  path: "/donate",
  keywords: [
    "donate Ukraine",
    "support Ukraine",
    "humanitarian support Ukraine",
    "Ukraine recovery support",
    "how to help Ukraine"
  ]
});

export default function DonatePage() {
  return (
    <>
      <PageShell
        eyebrow="Donate"
        title="How to Support Ukraine Effectively"
        description="A practical donor guide focused on impact, transparency, and long-term support."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="panel mx-auto max-w-4xl p-7 sm:p-10">
          <p className="text-sm leading-7 text-slate-700">
            Supporting Ukraine should be treated as a long-term civic decision, not a one-click emotional
            reaction. People usually donate when a shocking event appears in headlines, but sustainable help
            works differently. Recovery, emergency medicine, demining, housing repair, school continuity,
            legal support for families, and local community rebuilding all require consistent financing over
            months and years. If donors think in campaigns of one day, impact stays fragmented. If donors
            think in cycles of predictable support, local teams can plan resources, staff, logistics, and
            timelines with far better outcomes.
          </p>

          <figure className="my-8 max-w-xl overflow-hidden rounded-2xl border border-line md:ml-auto">
            <Image
              src="/donate-illustration-1.svg"
              alt="Minimal editorial illustration about structured donation planning"
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-line bg-mist px-4 py-3 text-xs text-slate-600">
              Minimal editorial illustration: structured and transparent donation planning.
            </figcaption>
          </figure>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink">What Makes a Donation Effective</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Effective giving is not defined by a big number alone. It is defined by fit, continuity, and
            accountability. Fit means your contribution should match a real operational need, not a vague
            slogan. Continuity means support should come on a schedule, because operational teams cannot buy
            medicine, protective equipment, transport fuel, or communication services with uncertain cashflow.
            Accountability means every donation route should be auditable at least at a high level: what is
            funded, how quickly funds are used, and what tangible output appears in the field.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Another important principle is portfolio support. Instead of putting everything into one narrow
            stream, practical donors split support across emergency response and long-term resilience.
            Emergency aid helps people now. Resilience support helps communities remain functional next month,
            next quarter, and next winter. This balance matters because war pressure is not linear. Periods of
            intense damage are followed by periods where infrastructure, clinics, and schools must be restored
            quickly to prevent secondary social collapse.
          </p>

          <figure className="my-9 max-w-lg overflow-hidden rounded-2xl border border-line md:-ml-4">
            <Image
              src="/donate-illustration-2.svg"
              alt="Minimal editorial illustration about balancing emergency and long-term support"
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-line bg-mist px-4 py-3 text-xs text-slate-600">
              Minimal editorial illustration: balancing urgent relief and long-term stability.
            </figcaption>
          </figure>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink">How to Read Impact Like an Editor</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Think like a newsroom editor evaluating evidence. Ask: what changed because this funding existed?
            Useful signals are concrete and measurable: families relocated to safe housing, medical kits
            delivered, school routes restored, legal services provided, or local infrastructure reconnected.
            Weak signals are purely emotional messages without operational detail. High-quality support channels
            explain constraints openly, update donors on execution delays, and adjust priorities when field
            conditions shift.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            Good donor behavior is disciplined behavior. Small recurring support can outperform occasional
            large transfers if it is reliable. Teams in the field can negotiate better procurement, reduce
            downtime, and avoid emergency overpaying when they know baseline funds will arrive. This is one of
            the least visible but most important drivers of real-world humanitarian efficiency.
          </p>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink">Donor Safety and Transparency Checklist</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>Use one clear payment route you control and can verify later.</li>
            <li>Keep a monthly giving schedule instead of irregular emotional transfers.</li>
            <li>Track outcomes and adjust your support mix every 30-60 days.</li>
            <li>Prefer channels that publish plain-language operational updates.</li>
            <li>Document your support decisions for consistency and accountability.</li>
          </ul>

          <figure className="my-9 max-w-2xl overflow-hidden rounded-2xl border border-line md:ml-10">
            <Image
              src="/donate-illustration-3.svg"
              alt="Minimal editorial illustration about practical donor workflow and verification"
              width={1200}
              height={675}
              className="h-auto w-full object-cover"
            />
            <figcaption className="border-t border-line bg-mist px-4 py-3 text-xs text-slate-600">
              Minimal editorial illustration: verification workflow for consistent donor impact.
            </figcaption>
          </figure>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink">PayPal Contact</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            For direct support coordination via PayPal, use the contact below. This page intentionally avoids
            external redirect lists and keeps one clear contact point for simplicity and trust.
          </p>
          <div className="mt-5 max-w-md overflow-hidden rounded-2xl border border-line bg-white p-3">
            <Image
              src="/paypal-badge.svg"
              alt="PayPal donation option"
              width={520}
              height={180}
              className="h-auto w-full object-contain"
            />
          </div>
          <p className="mt-4 text-base font-semibold text-ink">
            PayPal / Contact Email:{" "}
            <a
              href="mailto:vladkatintam@gmail.com"
              className="text-brand underline underline-offset-4"
            >
              vladkatintam@gmail.com
            </a>
          </p>
          <p className="mt-6 text-sm leading-7 text-slate-600">
            Editorial note: this guide is designed for clarity and donor discipline. The strongest results come
            from regular support, evidence-based review, and practical expectations about timelines. Consistent,
            transparent, and verified giving is what turns concern into durable impact.
          </p>
        </article>
      </section>
    </>
  );
}
