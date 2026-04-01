import { expect, test } from "@playwright/test";

async function openPage(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));

  expect(dimensions.scrollWidth, "document overflows horizontally").toBeLessThanOrEqual(
    dimensions.clientWidth + 1
  );
  expect(dimensions.bodyScrollWidth, "body overflows horizontally").toBeLessThanOrEqual(
    dimensions.clientWidth + 1
  );
}

async function expectStablePageChrome(page: import("@playwright/test").Page) {
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("main")).toBeVisible();
  await expectNoHorizontalOverflow(page);
}

test("home page renders without responsive overflow", async ({ page }) => {
  await openPage(page, "/");
  await expect(page).toHaveTitle(/New Ukraine Daily/i);
  await expect(page.getByText("Lead Story", { exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Edited from Zaporizhzhia, Ukraine", { exact: true })).toBeVisible();
  await expectStablePageChrome(page);
});

test("news hub renders curated sections cleanly", async ({ page }) => {
  await openPage(page, "/news");
  await expect(page.getByText("Lead report", { exact: true })).toBeVisible();
  await expect(page.getByText("Latest updates", { exact: true })).toBeVisible();
  await expect(page.getByText("Recent reports", { exact: true })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
  await expectStablePageChrome(page);
});

test("blog hub renders cards cleanly", async ({ page }) => {
  await openPage(page, "/blog");
  await expect(page.getByRole("heading", { name: "Analysis and explainers" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
  await expectStablePageChrome(page);
});

test("donate page renders support guide cleanly", async ({ page }) => {
  await openPage(page, "/donate");
  await expect(page.getByRole("heading", { name: /How to Support Ukraine Effectively/i })).toBeVisible();
  await expect(page.getByText("What Makes a Donation Effective", { exact: true })).toBeVisible();
  await expect(page.getByText(/PayPal \/ Contact Email/i)).toBeVisible();
  await expectStablePageChrome(page);
});

test("contact page renders map and newsroom context", async ({ page }) => {
  await openPage(page, "/contact");
  await expect(page.getByRole("heading", { name: /New Ukraine Daily is edited from Zaporizhzhia/i })).toBeVisible();
  await expect(page.locator('iframe[title="Map of Zaporizhzhia, Ukraine"]')).toBeVisible();
  await expect(page.getByRole("link", { name: /Open In Google Maps/i })).toBeVisible();
  await expectStablePageChrome(page);
});

test("trust pages render without layout breaks", async ({ page }) => {
  for (const path of ["/about", "/newsroom", "/editorial-policy", "/corrections"]) {
    await openPage(page, path);
    await expect(page.locator("h1")).toBeVisible();
    await expectStablePageChrome(page);
  }
});

test("news article page renders full article chrome", async ({ page }) => {
  await openPage(page, "/news");
  const firstArticle = page.locator('a[href^="/news/"]').first();
  await expect(firstArticle).toBeVisible();
  await firstArticle.click();
  await page.waitForLoadState("load");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("Share this article", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related News" })).toBeVisible();
  await expect(page.locator("text=At a glance").first()).toBeVisible();
  await expectStablePageChrome(page);
});

test("blog article page renders full article chrome", async ({ page }) => {
  await openPage(page, "/blog");
  const firstArticle = page.locator('a[href^="/blog/"]').first();
  await expect(firstArticle).toBeVisible();
  await firstArticle.click();
  await page.waitForLoadState("load");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText("Share this article", { exact: true })).toBeVisible();
  await expect(page.locator("text=At a glance").or(page.locator("text=Why it matters")).first()).toBeVisible();
  await expectStablePageChrome(page);
});
