import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "Review the terms governing use of New Ukraine Daily, including editorial content use, subscriber communications, external links, and limitations of liability.",
  path: "/terms",
  imagePath: "/og-editorial-policy.svg",
  imageAlt: "New Ukraine Daily terms of use"
});

export default function TermsPage() {
  return (
    <>
      <PageShell
        eyebrow="Legal"
        title="Terms of Use"
        description="These terms govern access to and use of New Ukraine Daily and its public pages, feeds, newsletter forms, and editorial materials."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <article className="panel p-5 sm:p-8 reading-copy">
          <p>
            <strong>Effective date:</strong> April 7, 2026
          </p>

          <h2>Use of the site</h2>
          <p>
            You may read, share, and reference the public content of New Ukraine Daily for lawful, personal, editorial, and informational purposes. You may not use the site in a way that disrupts service, abuses forms, scrapes protected content at scale, or interferes with newsroom operations.
          </p>

          <h2>Editorial content</h2>
          <p>
            New Ukraine Daily publishes reporting, summaries, analysis, explainers, and editorial materials. Content is provided for informational purposes. Nothing on the site should be treated as legal, medical, investment, or other licensed professional advice.
          </p>

          <h2>Intellectual property</h2>
          <p>
            Site design, copy, generated visuals, and editorial packaging belong to New Ukraine Daily unless otherwise stated. Source photographs, embedded materials, and referenced third-party assets may remain subject to their original owners&apos; rights.
          </p>

          <h2>Newsletter and contact forms</h2>
          <p>
            If you submit an email address or contact the newsroom, you must provide accurate information and may not use the forms to send spam, malicious content, or misleading claims. Newsletter signup does not create a paid service relationship.
          </p>

          <h2>External links</h2>
          <p>
            The site may reference outside sources, maps, platforms, and social networks. External links are provided for context and reader convenience. New Ukraine Daily is not responsible for the content, accuracy, privacy practices, or availability of third-party sites.
          </p>

          <h2>No warranties</h2>
          <p>
            The site is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted operation, complete accuracy, or error-free performance at all times.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, New Ukraine Daily is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the site, reliance on its content, or inability to access the service.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these terms as the site grows, adds products, or changes operating structure. Continued use of the site after changes take effect means you accept the updated terms.
          </p>

          <h2>Contact</h2>
          <p>
            For legal or policy questions related to these terms, contact the newsroom through <strong>/contact</strong> or by email at <strong>vladkatintam@gmail.com</strong>.
          </p>
        </article>
      </div>
    </>
  );
}
