"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  COOKIE_CONSENT_CHANGE_EVENT,
  readStoredCookieConsent,
  type CookieConsentState
} from "@/lib/privacy";

export function AnalyticsManager({ gaId }: { gaId: string }) {
  const [consentState, setConsentState] = useState<CookieConsentState>("unknown");

  useEffect(() => {
    const sync = () => {
      const nextState = readStoredCookieConsent();

      if (nextState !== "accepted") {
        const disableKey = `ga-disable-${gaId}`;
        (window as unknown as Record<string, boolean>)[disableKey] = true;
      }

      setConsentState(nextState);
    };

    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync as EventListener);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, sync as EventListener);
    };
  }, [gaId]);

  if (!gaId || consentState !== "accepted") {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window['ga-disable-${gaId}'] = false;
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
