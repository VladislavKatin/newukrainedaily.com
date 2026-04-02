import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Corrections",
  description: "How New Ukraine Daily handles corrections, clarifications, and visible article updates.",
  path: "/corrections",
  imagePath: "/og-corrections.svg",
  imageAlt: "Corrections at New Ukraine Daily"
});

export default function CorrectionsPage() {
  return (
    <>
      <PageShell
        eyebrow="Corrections"
        title="Corrections and updates"
        description="This page explains how factual corrections, clarifications, and article updates are handled across the newsroom."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="panel mx-auto max-w-4xl p-5 sm:p-8">
          <div className="reading-copy space-y-5">
            <p>
              When a material factual error is identified, the article is updated and the visible copy is corrected as quickly as possible. If a clarification is needed, the language is tightened without changing the underlying meaning of verified facts.
            </p>
            <h2>What to include in a correction request</h2>
            <p>
              Send the article URL, the specific line that appears to be wrong, and a concise explanation of the issue. If you are providing a source, include the original public reference or official statement.
            </p>
            <h2>How updates appear</h2>
            <p>
              Articles may be updated after publication to reflect new statements, revised casualty figures, official corrections, or clearer language. Routine copy edits may not be labeled, but substantive factual corrections are treated with higher priority and reviewed directly.
            </p>
            <h2>Contact</h2>
            <p>
              Correction requests are handled through the internal newsroom contact path. Use the contact page and include the URL, disputed line, and supporting public source.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}