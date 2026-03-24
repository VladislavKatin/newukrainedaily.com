import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "About New Ukraine Daily, its editorial model, trust standards, and approach to covering Ukraine, aid, diplomacy, and recovery.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About"
        title="About New Ukraine Daily"
        description="New Ukraine Daily is an English-language digital newsroom built to make Ukraine coverage clearer, faster to scan, and more useful to readers who need both facts and context."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="panel mx-auto max-w-4xl p-5 sm:p-8">
          <div className="reading-copy space-y-5 sm:space-y-6">
            <p>
              The newsroom focuses on Ukraine through daily reporting, policy explainers, recovery coverage, and practical support journalism. The aim is to publish useful reporting that respects the reader&apos;s time and avoids low-value content patterns.
            </p>
            <h2>What the publication is trying to do</h2>
            <p>
              The site is designed for readers who want a fast factual lead, clear sourcing, strong internal navigation, and enough context to understand why a development matters. That means short, readable reporting for daily news and longer explainers for more complicated policy or aid topics.
            </p>
            <h2>Coverage priorities</h2>
            <p>
              Core coverage areas include frontline developments, diplomacy, sanctions, humanitarian support, reconstruction, energy security, refugee policy, and accountability. The newsroom also maintains support-focused guides that help readers understand how aid can be directed more effectively.
            </p>
            <h2>Trust and standards</h2>
            <p>
              The site follows a standards-driven editorial workflow: sourcing, attribution, topic classification, metadata review, internal linking, and visible correction handling. The goal is not simply to publish more pages, but to publish pages that are clearer, more trustworthy, and more useful over time.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
