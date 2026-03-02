import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Donate",
  description: "Ways to support Ukraine through verified campaigns, aid organizations, and trusted response partners.",
  path: "/donate"
});

const donationOptions = [
  {
    name: "UNHCR Ukraine Emergency",
    type: "Refugee protection",
    href: "https://donate.unhcr.org/int/en/ukraine-emergency-v2",
    description:
      "UNHCR says donations support shelter, relief items, and protection services for displaced people affected by the war.",
    note: "Official UN refugee agency emergency appeal."
  },
  {
    name: "UNICEF Ukraine Appeal",
    type: "Children and families",
    href: "https://www.unicef.org/appeals/ukraine",
    description:
      "UNICEF's Ukraine appeal supports water, sanitation, nutrition, education, health, and child protection services.",
    note: "Official UNICEF humanitarian appeal page."
  },
  {
    name: "Razom for Ukraine",
    type: "Civil society and relief",
    href: "https://www.razomforukraine.org/donate-to-ukraine/",
    description:
      "Razom supports Ukraine through relief, health, advocacy, and community-driven response programs.",
    note: "Official Razom donation page."
  },
  {
    name: "Come Back Alive Foundation",
    type: "Defense support",
    href: "https://savelife.in.ua/en/",
    description:
      "Come Back Alive reports on equipment, training, and support programs for the Ukrainian Defense Forces.",
    note: "Official English site for the foundation."
  },
  {
    name: "International Rescue Committee",
    type: "Emergency relief",
    href: "https://help.rescue.org/donate/ukraine-crisis",
    description:
      "IRC says donations help fund emergency support such as food, medical care, and supplies for families affected by crises including Ukraine.",
    note: "Official IRC emergency giving page."
  }
];

export default function DonatePage() {
  return (
    <>
      <PageShell
        eyebrow="Donate"
        title="Support Ukraine"
        description="A short list of official and widely used donation routes. Check the destination, read the organization's disclosures, and choose the kind of support you actually intend to fund."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {donationOptions.map((option) => (
            <article key={option.name} className="panel p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                {option.type}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {option.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{option.description}</p>
              <p className="mt-4 text-sm leading-6 text-slate-500">{option.note}</p>
              <Link
                href={option.href}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand"
              >
                Visit official page
              </Link>
            </article>
          ))}
        </div>

        <section className="panel mt-8 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
            Before you give
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Confirm that the payment page is the official domain of the organization.</li>
            <li>Read how the organization describes the use of funds and current priorities.</li>
            <li>Decide whether you want humanitarian relief, refugee support, civil society work, or defense support.</li>
            <li>Prefer organizations that publish current reporting, program details, and contact information.</li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            This page is editorially curated for clarity. It is not financial or legal advice, and
            it does not replace your own due diligence before donating.
          </p>
        </section>
      </div>
    </>
  );
}
