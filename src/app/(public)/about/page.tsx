import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "About New Ukraine Daily, its editorial mission, publication scope, and reporting approach.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="About New Ukraine Daily"
      description="New Ukraine Daily is a lightweight publication focused on Ukraine news, support coverage, topic archives, and editorial reporting."
    />
  );
}
