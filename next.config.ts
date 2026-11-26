import type { NextConfig } from "next";

// The production site is a fully static export served by Cloudflare Pages.
// Content is rebuilt by GitHub Actions after every automation run.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
