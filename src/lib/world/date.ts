import "server-only";

const WORLD_DIGEST_TIME_ZONE = "Europe/Kyiv";

export function isWorldDigestDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function formatWorldDigestDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}

export function worldDigestDateFromDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WORLD_DIGEST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export function createWorldDigestDateWindow(digestDate: string) {
  const start = new Date(`${digestDate}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}
