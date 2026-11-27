import type { Metadata } from "next";
import "@/app/globals.css";
import { AnalyticsManager } from "@/components/analytics-manager";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getEnv, validateEnv } from "@/lib/env";
import { absoluteUrl, getBaseUrl, siteConfig } from "@/lib/site";

validateEnv();

// Old listing URLs used "?page=N"; the static site uses "/page/N".
const legacyPaginationRedirect = `(function(){try{var p=new URLSearchParams(location.search).get("page");var n=parseInt(p||"",10);if(n>1&&/^\\/(news|blog|topic\\/[^/]+)\\/?$/.test(location.pathname)){location.replace(location.pathname.replace(/\\/$/,"")+"/page/"+n);}}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  // No site-wide canonical here: it was inherited by pages without their own
  // (e.g. the 404 page) and pointed them at the home page.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon.svg"]
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: getEnv().GOOGLE_SITE_VERIFICATION || undefined
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [
      {
        url: absoluteUrl(siteConfig.defaultOgImage),
        width: 1200,
        height: 630,
        alt: siteConfig.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [absoluteUrl(siteConfig.defaultOgImage)]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = getEnv().GOOGLE_ANALYTICS_ID || "G-3M900FBKZS";

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: legacyPaginationRedirect
          }}
        />
        <AnalyticsManager gaId={gaId} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
