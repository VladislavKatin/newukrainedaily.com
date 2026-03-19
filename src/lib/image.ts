export function shouldBypassImageOptimization(url?: string | null) {
  if (!url) {
    return false;
  }

  return /^https?:\/\//i.test(url);
}
