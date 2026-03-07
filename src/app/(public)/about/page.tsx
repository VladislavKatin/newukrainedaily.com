import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "About New Ukraine Daily, its editorial standards, reporting priorities, and coverage of Ukraine, aid, diplomacy, and recovery.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <>
      <PageShell
        eyebrow="About"
        title="About New Ukraine Daily"
        description="New Ukraine Daily is an English-language publication covering Ukraine through daily reporting, support guidance, topic tracking, and editorial context built for readers who want clarity rather than noise."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="panel mx-auto max-w-4xl p-5 sm:p-8">
          <div className="reading-copy space-y-4 sm:space-y-5">
            <p>
              New Ukraine Daily is built for readers who need a cleaner signal: daily news, stronger context,
              practical support guidance, and topic pages that make recurring developments easier to follow over time.
            </p>
            <p>
              The site focuses on Ukraine, diplomacy, security, recovery, humanitarian support, and the broader policy decisions shaping the country&apos;s future. The goal is not to overwhelm readers with noise, but to surface the developments that matter and explain why they matter.
            </p>
            <h2>Editorial focus</h2>
            <p>
              Coverage is structured around published news updates, explainers, blog analysis, and support-oriented reporting. Each format serves a different purpose, but the standard is consistent: factual reporting first, context second, and clarity throughout.
            </p>
            <h2>How the site works</h2>
            <p>
              The publication uses a structured editorial workflow that combines source monitoring, content review, metadata generation, topic organization, and internal linking. The output is designed to be readable for people and legible for search engines without relying on thin content or template-heavy copy.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
