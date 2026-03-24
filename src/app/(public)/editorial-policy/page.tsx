import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Editorial Policy",
  description: "Editorial policy for sourcing, attribution, corrections, disclosures, updates, and newsroom review standards.",
  path: "/editorial-policy"
});

export default function EditorialPolicyPage() {
  return (
    <>
      <PageShell
        eyebrow="Policy"
        title="Editorial policy"
        description="This page sets out the site&apos;s standards for sourcing, attribution, visible corrections, AI disclosures, updates, and editorial review."
      />
      <section className="container-shell pb-12 sm:pb-16">
        <article className="panel mx-auto max-w-4xl p-5 sm:p-8">
          <div className="reading-copy space-y-5 sm:space-y-6">
            <h2>Sourcing and attribution</h2>
            <p>
              News reports should identify the reporting source clearly and avoid unsupported claims. When a story comes from an agency, official statement, or institutional source, that attribution should remain visible to the reader.
            </p>
            <h2>Headlines and framing</h2>
            <p>
              Headlines should match the actual angle of the story. They should not exaggerate routine developments, invent urgency, or make an old trend sound like a new breaking event.
            </p>
            <h2>Corrections and updates</h2>
            <p>
              When a factual error is confirmed, the article is corrected and the visible copy is updated. Clarifications may also be made when a sentence is too broad, misleading, or insufficiently specific.
            </p>
            <h2>AI and illustrations</h2>
            <p>
              AI illustrations are labeled as illustrations and are not presented as documentary photography. Real source images should remain clearly attributable as source or agency photos.
            </p>
            <h2>Reader-first standards</h2>
            <p>
              The site is built to avoid thin archives, duplicate angles, filler-heavy copy, and technical metadata leaking into the visible article experience. Clear writing, structured context, and useful navigation take priority over volume alone.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
