import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Newsroom",
  description: "Newsroom structure, editorial desks, contact paths, and trust information for New Ukraine Daily.",
  path: "/newsroom"
});

const desks = [
  ["Daily News Desk", "Breaking news, verified daily developments, and fast updates on Ukraine."],
  ["Analysis Desk", "Explainers, policy context, and longer-form pieces that help readers understand what matters."],
  ["Audience and Standards", "Corrections, updates, sourcing review, and reader questions."],
  ["Support and Recovery Coverage", "Coverage of aid, reconstruction, civil society, and practical ways to help Ukraine."]
];

export default function NewsroomPage() {
  return (
    <>
      <PageShell
        eyebrow="Newsroom"
        title="Newsroom and masthead"
        description="New Ukraine Daily is organized around a small digital newsroom model: fast reporting, explainers, standards review, and support-focused coverage for readers following Ukraine closely."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="panel p-5 sm:p-8">
            <div className="reading-copy space-y-5">
              <p>
                The site is built around an editorial desk model rather than a general-purpose content feed. News is published quickly, then expanded with context, related coverage, and follow-up updates as reporting develops.
              </p>
              <h2>What the newsroom is responsible for</h2>
              <p>
                The newsroom reviews source quality, verifies attribution, watches for duplicates, updates headlines when angles change, and corrects visible errors when needed. The goal is straightforward: make the site useful for readers and defensible for search.
              </p>
              <h2>How to reach the desk</h2>
              <p>
                Editorial questions, correction requests, partnership proposals, and source notes can all be sent to the contact address listed on the contact page. The fastest way to resolve an issue is to include the article URL and a short description of what needs attention.
              </p>
            </div>
          </article>
          <section className="grid gap-4">
            {desks.map(([title, description]) => (
              <div key={title} className="panel p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Desk</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </section>
        </div>
      </section>
    </>
  );
}
