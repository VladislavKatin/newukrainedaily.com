import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description: "Contact page placeholder for editorial inquiries and partnerships.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Contact"
      description="Use this page for editorial contact details, correction requests, and partnership inquiries."
    />
  );
}

