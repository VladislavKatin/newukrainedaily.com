export const COOKIE_CONSENT_STORAGE_KEY = "nud_cookie_consent";
export const COOKIE_CONSENT_COOKIE_NAME = "nud_cookie_consent";
export const COOKIE_CONSENT_CHANGE_EVENT = "nud-cookie-consent-change";
export const COOKIE_CONSENT_OPEN_EVENT = "nud-cookie-consent-open";

export type CookieConsentState = "accepted" | "rejected" | "unknown";

const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function readStoredCookieConsent(): CookieConsentState {
  if (!isBrowser()) {
    return "unknown";
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${COOKIE_CONSENT_COOKIE_NAME}=`))
    ?.split("=")[1];

  const storedValue = cookieValue || window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

  if (storedValue === "accepted" || storedValue === "rejected") {
    return storedValue;
  }

  return "unknown";
}

export function persistCookieConsent(state: Exclude<CookieConsentState, "unknown">) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, state);
  document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${state}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGE_EVENT, { detail: { state } }));
}

export function openCookiePreferences() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
}

export function clearGoogleAnalyticsCookies() {
  if (!isBrowser()) {
    return;
  }

  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const candidateDomains = [
    hostname,
    parts.length > 1 ? `.${parts.slice(-2).join(".")}` : hostname
  ].filter(Boolean);

  const cookieNames = document.cookie
    .split("; ")
    .map((part) => part.split("=")[0])
    .filter((name) => /^(_ga|_gid|_gat|_gcl|_gac_)/.test(name));

  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;

    for (const domain of candidateDomains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
    }
  }
}
