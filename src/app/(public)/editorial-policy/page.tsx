import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Editorial Policy",
  description: "Editorial policy for sourcing, attribution, corrections, disclosures, and review standards.",
  path: "/editorial-policy"
});

export default function EditorialPolicyPage() {
  return (
    <PageShell
      eyebrow="Policy"
      title="Editorial policy"
      description="This page defines sourcing standards, correction handling, disclosures, attribution, and content review expectations."
    />
  );
}
