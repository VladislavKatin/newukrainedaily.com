import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About",
  description: "About page placeholder for mission, process, and publication scope.",
  path: "/about"
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="About this project"
      description="This project is a lightweight foundation for Ukraine-focused publishing, automation, and search-friendly archives."
    />
  );
}

