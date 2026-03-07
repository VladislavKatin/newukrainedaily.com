import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description:
    "About New Ukraine Daily, its editorial standards, reporting priorities, and coverage of Ukraine, aid, diplomacy, and recovery.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="About New Ukraine Daily"
      description="New Ukraine Daily is an English-language publication covering Ukraine through daily reporting, support guidance, topic tracking, and editorial context built for readers who want clarity rather than noise."
    />
  );
}
