import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate",
  description: "Ways to support Ukraine through verified campaigns, aid organizations, and trusted response partners.",
  path: "/donate"
});

export default function DonatePage() {
  return (
    <PageShell
      eyebrow="Donate"
      title="Support Ukraine"
      description="Find verified campaigns, trusted aid organizations, and transparent support pathways gathered for Ukraine-focused readers."
    />
  );
}
