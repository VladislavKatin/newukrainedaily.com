const fallbackBaseUrl = "http://localhost:3000";

export const siteConfig = {
  name: "New Ukraine Daily",
  description:
    "English-language publishing platform for Ukraine news, analysis, support resources, and topic archives.",
  locale: "en_US",
  defaultOgImage: "/icon.svg",
  publisherName: "New Ukraine Daily Editorial Team"
};

export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || fallbackBaseUrl;
}

export function absoluteUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString();
}

export function getPublisherLogoUrl() {
  return absoluteUrl("/icon.svg");
}
