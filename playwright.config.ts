import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.SMOKE_BASE_URL || "https://www.newukrainedaily.com";

export default defineConfig({
  testDir: "./tests",
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 }
      }
    },
    {
      name: "firefox-tablet",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 834, height: 1194 }
      }
    },
    {
      name: "webkit-mobile",
      use: {
        ...devices["iPhone 13"]
      }
    }
  ]
});
