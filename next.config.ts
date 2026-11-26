import type { NextConfig } from "next";

// The production site is a fully static export served by Cloudflare Pages.
// Content is rebuilt by GitHub Actions after every automation run.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    // Keep database load low while prerendering (Supabase pooler has few connections).
    cpus: 2,
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3
  }
};

export default nextConfig;
