import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Learn what personal information New Ukraine Daily collects, how newsletter signups and analytics are handled, and how to contact the newsroom about privacy questions.",
  path: "/privacy-policy",
  imagePath: "/og-contact.svg",
  imageAlt: "New Ukraine Daily privacy policy"
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageShell
        eyebrow="Privacy"
        title="Privacy Policy"
        description="This policy explains what personal information New Ukraine Daily collects, how we use it, and how readers can contact the newsroom about privacy requests."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <article className="panel p-5 sm:p-8 reading-copy">
          <p>
            <strong>Effective date:</strong> April 7, 2026
          </p>
          <p>
            New Ukraine Daily is an English-language newsroom focused on Ukraine, world affairs, diplomacy, aid, energy, and accountability. This Privacy Policy applies to information collected through <strong>newukrainedaily.com</strong>.
          </p>

          <h2>Information we collect</h2>
          <p>We collect a limited set of information needed to operate the site, respond to readers, and maintain a subscriber list.</p>
          <ul>
            <li>Email addresses and optional names submitted through the newsletter form.</li>
            <li>Technical information such as IP address, browser type, device type, pages visited, and referring URLs when analytics is enabled.</li>
            <li>Operational logs needed for security, debugging, and site reliability.</li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>To save newsletter signups for future email briefings and outreach.</li>
            <li>To monitor site performance, traffic patterns, and reliability when analytics consent is granted.</li>
            <li>To investigate abuse, maintain security, and protect the site from automated misuse.</li>
          </ul>

          <h2>Cookies and analytics</h2>
          <p>
            The site uses essential technical cookies needed for basic operation. If you accept analytics cookies through the consent banner, the site may also load Google Analytics. If you reject analytics, Google Analytics stays off.
          </p>
          <p>
            You can change your choice later through the <strong>Cookie preferences</strong> control in the site footer.
          </p>

          <h2>Third-party services</h2>
          <p>We use a small number of service providers to operate the site. Depending on the page and your choices, data may be processed by:</p>
          <ul>
            <li>Google Analytics for traffic measurement, only after analytics consent.</li>
            <li>Google Maps on the contact page when you load or open map content.</li>
            <li>Hosting, storage, CDN, and database providers used to serve the site and store newsletter data.</li>
          </ul>

          <h2>Newsletter signups</h2>
          <p>
            Newsletter signups are stored in our internal subscriber database for future mailings. At this stage, we are collecting subscriber addresses for future distribution and operational contact. When email campaigns begin, messages will include unsubscribe instructions.
          </p>

          <h2>Data sharing</h2>
          <p>
            We do not state that we sell personal information. We do not intentionally build profiles for cross-context behavioral advertising on this site. If that changes, the site policy and user controls must change with it.
          </p>

          <h2>Children&apos;s privacy</h2>
          <p>
            This site is not directed to children under 13, and we do not knowingly collect personal information from children under 13.
          </p>

          <h2>Retention and security</h2>
          <p>
            We retain subscriber and operational data for as long as reasonably needed for newsroom operations, future email distribution, abuse prevention, and legal compliance. Access is limited to the site operator and trusted technical workflows required to run the service.
          </p>

          <h2>Your requests</h2>
          <p>
            To ask about your data, request deletion of a newsletter signup, or raise a privacy concern, contact the newsroom through the contact page or by email at <strong>vladkatintam@gmail.com</strong>.
          </p>

          <h2>Policy changes</h2>
          <p>
            This policy may be updated as the site adds new features, analytics tools, advertising, or newsletter infrastructure. Material changes should be reflected on this page with an updated effective date.
          </p>
        </article>
      </div>
    </>
  );
}
