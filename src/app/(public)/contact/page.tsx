import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact New Ukraine Daily for editorial inquiries, corrections, partnerships, and support-related communication.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <>
      <PageShell
        eyebrow="Contact"
        title="Contact"
        description="Use this page for editorial inquiries, correction requests, partnerships, and support-related contact."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <section className="panel mx-auto max-w-3xl p-5 sm:p-8">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                Contact
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Editorial and support communication
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Use this address for corrections, editorial questions, partnerships, and support-related communication connected to the site.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-mist p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                Email
              </p>
              <p className="mt-3 break-all text-lg font-semibold text-ink">
                vladkatintam@gmail.com
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                For the fastest review, include a clear subject line and the URL of the page you are referencing.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
