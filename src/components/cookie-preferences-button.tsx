"use client";

import { openCookiePreferences } from "@/lib/privacy";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className="text-left transition hover:text-ink"
    >
      Cookie preferences
    </button>
  );
}
