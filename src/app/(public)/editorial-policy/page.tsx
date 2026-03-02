import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Editorial Policy",
  description: "Editorial policy placeholder for sourcing, corrections, and disclosures.",
  path: "/editorial-policy"
});

export default function EditorialPolicyPage() {
  return (
    <PageShell
      eyebrow="Policy"
      title="Editorial policy"
      description="Document sourcing standards, corrections handling, disclosures, and content review workflows here."
    />
  );
}

