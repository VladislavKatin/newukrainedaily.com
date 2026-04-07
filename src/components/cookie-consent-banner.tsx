"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearGoogleAnalyticsCookies,
  COOKIE_CONSENT_OPEN_EVENT,
  persistCookieConsent,
  readStoredCookieConsent
} from "@/lib/privacy";

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const storedState = readStoredCookieConsent();
    setIsOpen(storedState === "unknown");

    const handleOpen = () => setIsOpen(true);
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen as EventListener);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen as EventListener);
    };
  }, []);

  function accept() {
    persistCookieConsent("accepted");
    setIsOpen(false);
  }

  function reject() {
    clearGoogleAnalyticsCookies();
    persistCookieConsent("rejected");
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Privacy Choices</p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            We use essential site cookies and, if you allow it, Google Analytics to understand traffic and improve the site.
            You can accept analytics cookies or keep analytics off. See the{" "}
            <Link href="/privacy-policy" className="font-semibold text-ink underline decoration-brand/40 underline-offset-4">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reject}
            className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
          >
            Reject analytics
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
