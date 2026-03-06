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
        <section className="panel mx-auto max-w-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            Email
          </p>
          <a
            href="mailto:vladkatintam@gmail.com"
            className="mt-3 inline-block text-lg font-semibold text-ink underline underline-offset-4"
          >
            vladkatintam@gmail.com
          </a>
        </section>
      </div>
    </>
  );
}
