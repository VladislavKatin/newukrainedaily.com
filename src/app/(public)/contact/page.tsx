import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact New Ukraine Daily in Zaporizhzhia, Ukraine for editorial inquiries, corrections, partnerships, and newsroom communication.",
  path: "/contact"
});

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/Zaporizhzhia,+Zaporizhia+Oblast,+Ukraine";
const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps?q=Zaporizhzhia,+Ukraine&z=8&output=embed";

function ZaporizhzhiaFrontlineMap() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-[#f8fbff] shadow-soft">
      <svg
        viewBox="0 0 780 420"
        className="h-auto w-full"
        role="img"
        aria-label="Illustrated map showing Zaporizhzhia and approximate distance to active war zone"
      >
        <defs>
          <linearGradient id="sea" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ecfccb" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>
          <linearGradient id="front" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        <rect width="780" height="420" fill="url(#sea)" />
        <path
          d="M58 82c54-36 124-50 203-40 45 6 97 19 149 16 59-4 108-33 164-41 69-10 122 6 150 30v316H58V82Z"
          fill="url(#land)"
          stroke="#bfdbfe"
          strokeWidth="2"
        />
        <path
          d="M307 33c21 52 30 104 26 159-5 54-19 103-44 146-17 30-41 56-64 82"
          fill="none"
          stroke="#60a5fa"
          strokeLinecap="round"
          strokeWidth="9"
          opacity="0.75"
        />
        <path
          d="M474 144c17 12 33 28 47 47 16 22 29 48 46 69 20 24 46 39 69 55"
          fill="none"
          stroke="#f59e0b"
          strokeDasharray="8 10"
          strokeLinecap="round"
          strokeWidth="6"
          opacity="0.7"
        />
        <path
          d="M518 104c18 21 35 42 41 67 6 28 2 57-4 84-7 31-16 61-18 93"
          fill="none"
          stroke="url(#front)"
          strokeDasharray="14 12"
          strokeLinecap="round"
          strokeWidth="8"
        />

        <circle cx="336" cy="168" r="11" fill="#0f5bd8" />
        <circle cx="523" cy="188" r="9" fill="#dc2626" />

        <path d="M348 174 454 184" stroke="#0f172a" strokeDasharray="6 7" strokeWidth="2.5" opacity="0.6" />
        <rect x="355" y="141" width="120" height="30" rx="15" fill="#0f172a" />
        <text x="415" y="160" fill="#fff" fontFamily="Georgia, serif" fontSize="15" textAnchor="middle">
          approx. 20 km
        </text>

        <rect x="94" y="270" width="214" height="98" rx="22" fill="#ffffff" fillOpacity="0.92" stroke="#cbd5e1" />
        <text x="118" y="302" fill="#0f172a" fontFamily="Georgia, serif" fontSize="24" fontWeight="700">
          Zaporizhzhia
        </text>
        <text x="118" y="328" fill="#475569" fontFamily="Arial, sans-serif" fontSize="16">
          Newsroom base in southeastern Ukraine
        </text>
        <text x="118" y="350" fill="#475569" fontFamily="Arial, sans-serif" fontSize="16">
          Editorial team works close to the frontline
        </text>

        <rect x="530" y="72" width="180" height="70" rx="22" fill="#fff7ed" stroke="#fdba74" />
        <text x="620" y="101" fill="#9a3412" fontFamily="Georgia, serif" fontSize="20" fontWeight="700" textAnchor="middle">
          Active war zone
        </text>
        <text x="620" y="123" fill="#9a3412" fontFamily="Arial, sans-serif" fontSize="14" textAnchor="middle">
          Approximate direction and distance
        </text>

        <text x="337" y="149" fill="#0f172a" fontFamily="Arial, sans-serif" fontSize="13">
          newsroom
        </text>
        <text x="535" y="173" fill="#7f1d1d" fontFamily="Arial, sans-serif" fontSize="13">
          front line area
        </text>
      </svg>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageShell
        eyebrow="Contact"
        title="Contact The Newsroom"
        description="Reach New Ukraine Daily for editorial questions, corrections, partnerships, and direct newsroom communication from Zaporizhzhia, Ukraine."
      />
      <div className="container-shell pb-12 sm:pb-16">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              Editorial Desk
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              New Ukraine Daily is edited from Zaporizhzhia
            </h2>
            <div className="reading-copy mt-5 space-y-4 sm:space-y-5">
              <p>
                The newsroom is based in <strong>Zaporizhzhia, Ukraine</strong>. We work from a city that sits close to the war, with the editorial base located roughly <strong>20 kilometers from active fighting</strong>.
              </p>
              <p>
                That proximity shapes how we think about urgency, clarity, and sourcing. Our contact page is not just for partnerships and corrections. It is also the simplest way to reach a newsroom working under real wartime pressure in southern Ukraine.
              </p>
              <p>
                Use this address for editorial questions, correction requests, partnership inquiries, newsroom background requests, and direct communication about coverage on Ukraine, security, aid, energy, and reconstruction.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-mist p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  Email
                </p>
                <p className="mt-3 break-all text-lg font-semibold text-ink">
                  <a href="mailto:vladkatintam@gmail.com" rel="nofollow">vladkatintam@gmail.com</a>
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  For the fastest review, include the article URL and a direct description of the issue or request.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-mist p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
                  Location
                </p>
                <p className="mt-3 text-lg font-semibold text-ink">
                  Zaporizhzhia, Ukraine
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Southeastern Ukraine. Newsroom reporting and editorial coordination take place from this region.
                </p>
              </div>
            </div>
          </article>

          <aside className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              Open The Map
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              See where Zaporizhzhia is located
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              You can open Zaporizhzhia directly in Google Maps to view the city, surrounding region, and its position in southern Ukraine.
            </p>
            <div className="mt-5 overflow-hidden rounded-[28px] border border-line">
              <iframe
                src={GOOGLE_MAPS_EMBED_URL}
                title="Map of Zaporizhzhia, Ukraine"
                className="h-[320px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                Open In Google Maps
              </a>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
              >
                About The Newsroom
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              Regional Context
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Zaporizhzhia on the map of the war
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              This illustration is a simple orientation graphic. It shows Zaporizhzhia as the newsroom base, the approximate direction of frontline pressure, and the short distance that shapes daily reporting conditions.
            </p>
            <div className="mt-5">
              <ZaporizhzhiaFrontlineMap />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The map is an editorial orientation visual, not a military navigation tool. It is meant to help readers understand why proximity matters to how this newsroom covers events on the ground.
            </p>
          </article>

          <article className="panel p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">
              What To Send
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Best way to contact the editorial team
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                <strong className="text-ink">Corrections:</strong> send the exact URL and the factual issue you want reviewed.
              </p>
              <p>
                <strong className="text-ink">Editorial requests:</strong> describe the topic, deadline, and why you are reaching out.
              </p>
              <p>
                <strong className="text-ink">Partnerships:</strong> include the organization name, collaboration type, and expected scope.
              </p>
              <p>
                <strong className="text-ink">Security-sensitive communication:</strong> keep the subject line clear and avoid sending anything you do not want forwarded or archived.
              </p>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}
