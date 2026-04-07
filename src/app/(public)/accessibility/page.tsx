import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Accessibility",
  description:
    "Read the accessibility commitment for New Ukraine Daily and learn how to report barriers or request support when using the site.",
  path: "/accessibility",
  imagePath: "/og-newsroom.svg",
  imageAlt: "New Ukraine Daily accessibility statement"
});

export default function AccessibilityPage() {
  return (
    <>
      <PageShell
        eyebrow="Accessibility"
        title="Accessibility Statement"
        description="New Ukraine Daily aims to keep the site readable, navigable, and usable across devices, browsers, and assistive technologies."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <article className="panel p-5 sm:p-8 reading-copy">
          <p>
            <strong>Effective date:</strong> April 7, 2026
          </p>
          <p>
            We aim to make New Ukraine Daily usable for readers on mobile, tablet, desktop, and assistive technology workflows. Accessibility work is part of ongoing site maintenance, not a one-time claim.
          </p>

          <h2>What we are working toward</h2>
          <ul>
            <li>Clear headings, readable typography, and stable page layouts.</li>
            <li>Keyboard-accessible navigation and interactive controls.</li>
            <li>Descriptive link text, alternative text where appropriate, and semantic page structure.</li>
            <li>Responsive layouts that remain usable across common browser and device sizes.</li>
          </ul>

          <h2>Known limits</h2>
          <p>
            Some third-party content, external embeds, publisher-provided images, and live operational components may not always meet the same accessibility standard as the site&apos;s native interface. We treat those gaps as defects to reduce over time.
          </p>

          <h2>How to report an accessibility issue</h2>
          <p>
            If you find a barrier, send the page URL, the issue you encountered, the device or browser you used, and any assistive technology involved. The most direct route is the newsroom contact page or email: <strong>vladkatintam@gmail.com</strong>.
          </p>

          <h2>Response approach</h2>
          <p>
            We review credible accessibility reports as part of site maintenance and release work. High-impact issues affecting reading, navigation, forms, or core access should be prioritized first.
          </p>
        </article>
      </div>
    </>
  );
}
