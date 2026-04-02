import Image from "next/image";
import { ExternalLink } from "@/components/external-link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate to Support Ukraine",
  description:
    "A practical donation guide focused on impact, transparency, local knowledge, and long-term support for Ukraine.",
  path: "/donate",
  keywords: [
    "donate Ukraine",
    "support Ukraine",
    "humanitarian support Ukraine",
    "Ukraine recovery support",
    "how to help Ukraine"
  ]
});

const supportPriorities = [
  "Emergency response and direct support for families under pressure.",
  "Education, community continuity, and local recovery work.",
  "Structured giving with clear priorities instead of one-off emotional transfers."
];

const donorChecks = [
  "Use one payment route you can verify later.",
  "Support on a repeatable monthly schedule whenever possible.",
  "Prefer work that explains what changed and what still needs funding.",
  "Review outcomes every 30 to 60 days instead of donating blindly.",
  "Keep practical records of your support decisions and follow-up."
];

export default function DonatePage() {
  return (
    <>
      <PageShell
        eyebrow="Donate"
        title="Support Ukraine With Clear Priorities"
        description="A practical donor guide built around local context, transparent giving, and durable impact."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
          <section className="panel overflow-hidden p-5 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Local context</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-4xl">
                  Practical support works best when donors understand who is doing the work and why the need is ongoing.
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Ukraine needs disciplined, recurring support. Emergency medicine, housing repair, education continuity,
                  community logistics, and local resilience all depend on predictable financing. A donor who thinks in
                  monthly cycles gives local teams room to plan staff, supplies, transport, and response timelines.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-line bg-mist px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Priority</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Urgent help plus long-term stability, not one without the other.</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-mist px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Discipline</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Regular giving beats irregular emotional spikes.</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-mist px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Trust</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">Clear goals, clear route, clear evidence of use.</p>
                  </div>
                </div>
              </div>
              <figure className="overflow-hidden rounded-[28px] border border-line bg-mist">
                <Image
                  src="/donate-support-hero.svg"
                  alt="Editorial illustration showing community support, aid delivery, and local planning in Ukraine"
                  width={1200}
                  height={675}
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="h-auto w-full object-cover"
                />
                <figcaption className="border-t border-line bg-white/80 px-4 py-3 text-xs leading-5 text-slate-600">
                  Structured support works when emergency relief, community logistics, and local planning stay connected.
                </figcaption>
              </figure>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="panel p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Who is behind this page</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">The newsroom team also founded a Ukrainian civic foundation.</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                The team behind New Ukraine Daily also founded <strong>GO &quot;Fond rozvytku mozhlyvostei&quot;</strong>
                {" "}(GO &quot;Фонд розвитку можливостей&quot;). The organization is based in Zaporizhzhia and works on local civic,
                educational, and community initiatives.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-600">
                This matters because donor trust is stronger when the people asking for support are visible, locally grounded,
                and tied to real operational work rather than anonymous collection pages.
              </p>
              <div className="mt-6 rounded-2xl border border-line bg-mist p-4">
                <p className="text-sm font-semibold text-ink">Foundation reference</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Verified public website and contacts page for GO &quot;Fond rozvytku mozhlyvostei&quot;.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ExternalLink
                    href="https://penzlyk.org.ua/"
                    className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sky"
                  >
                    Open foundation website
                  </ExternalLink>
                  <ExternalLink
                    href="https://penzlyk.org.ua/?page_id=23"
                    className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-sky"
                  >
                    Open foundation contacts
                  </ExternalLink>
                </div>
              </div>
            </div>
            <figure className="panel overflow-hidden p-3 sm:p-4">
              <Image
                src="/donate-local-impact.svg"
                alt="Editorial illustration showing local community programs, education support, and civic coordination"
                width={1200}
                height={675}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full rounded-[24px] object-cover"
              />
              <figcaption className="px-2 pb-2 pt-4 text-xs leading-5 text-slate-600">
                Local civic work, education support, and direct community coordination need predictable funding and local ownership.
              </figcaption>
            </figure>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="panel p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">How to give better</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Treat support as an operating system, not a one-day reaction.</h2>
              <ul className="mt-6 space-y-3">
                {supportPriorities.map((item) => (
                  <li key={item} className="rounded-2xl border border-line bg-mist px-4 py-4 text-sm leading-6 text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
              <div className="reading-copy mt-8">
                <h2>What makes a donation effective</h2>
                <p className="mt-4">
                  Effective giving is defined by fit, continuity, and accountability. Fit means money is aligned with a real
                  operational need. Continuity means support arrives on a schedule. Accountability means the route is clear,
                  the output is visible, and the reporting is understandable without donor guesswork.
                </p>
                <p className="mt-4">
                  Good donors build a support mix. One part should serve urgent needs. Another part should keep communities
                  functional next month and next winter. That balance matters because war pressure does not stop when the
                  headline cycle moves on.
                </p>
              </div>
            </div>
            <figure className="panel overflow-hidden p-3 sm:p-4">
              <Image
                src="/donate-accountability.svg"
                alt="Editorial illustration showing transparent donor workflow from funding to aid delivery and reporting"
                width={1200}
                height={675}
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="h-auto w-full rounded-[24px] object-cover"
              />
              <figcaption className="px-2 pb-2 pt-4 text-xs leading-5 text-slate-600">
                The strongest donation path is simple: defined need, verified route, delivered result, and clear reporting.
              </figcaption>
            </figure>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="panel p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Checklist</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Donor safety and transparency checks</h2>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {donorChecks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="panel p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Direct support route</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">PayPal contact</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                This page keeps one clear donation route instead of a long list of redirects. If you want to coordinate direct
                support, use the contact below and keep your giving documented and consistent.
              </p>
              <div className="mt-5 max-w-md overflow-hidden rounded-2xl border border-line bg-white p-3">
                <Image
                  src="/paypal-badge.svg"
                  alt="PayPal donation option"
                  width={520}
                  height={180}
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="h-auto w-full object-contain"
                />
              </div>
              <p className="mt-4 text-base font-semibold text-ink">PayPal / Contact Email: <span className="text-ink">vladkatintam@gmail.com</span></p>
              <p className="mt-6 text-sm leading-7 text-slate-600">
                Editorial note: the strongest results come from regular support, evidence-based review, and practical expectations about
                timelines. Consistent, transparent, and verified giving turns concern into durable impact.
              </p>
            </div>
          </section>
        </article>
      </section>
    </>
  );
}

