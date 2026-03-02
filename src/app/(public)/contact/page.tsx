import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact New Ukraine Daily for editorial inquiries, corrections, partnerships, and support-related communication.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Contact"
      description="Use this page for editorial inquiries, correction requests, partnerships, and support-related contact."
    />
  );
}
