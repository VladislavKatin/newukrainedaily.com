const fallbackBaseUrl = "http://localhost:3000";

export const siteConfig = {
  name: "New Ukraine Daily",
  description:
    "English-language publishing platform for Ukraine news, analysis, support resources, and topic archives.",
  locale: "en_US",
  defaultOgImage:
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80"
};

export function getBaseUrl() {
  return process.env.PUBLIC_BASE_URL || fallbackBaseUrl;
}

export function absoluteUrl(path = "/") {
  return new URL(path, getBaseUrl()).toString();
}
