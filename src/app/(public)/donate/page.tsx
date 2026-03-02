import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate",
  description: "Support page placeholder for verified campaigns and aid partners.",
  path: "/donate"
});

export default function DonatePage() {
  return (
    <PageShell
      eyebrow="Donate"
      title="Support Ukraine"
      description="This placeholder page is reserved for verified campaigns, partner organizations, and transparent funding notes."
    />
  );
}

