import { expect, test } from "@playwright/test";

async function openPage(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
}

test.describe("frontend visual baselines", () => {
  test("contact page visual baseline", async ({ page }) => {
    await openPage(page, "/contact");
    await expect(page).toHaveScreenshot("contact-page.png", {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator('iframe[title="Map of Zaporizhzhia, Ukraine"]')]
    });
  });

  test("about page visual baseline", async ({ page }) => {
    await openPage(page, "/about");
    await expect(page).toHaveScreenshot("about-page.png", {
      fullPage: true,
      animations: "disabled"
    });
  });

  test("newsroom page visual baseline", async ({ page }) => {
    await openPage(page, "/newsroom");
    await expect(page).toHaveScreenshot("newsroom-page.png", {
      fullPage: true,
      animations: "disabled"
    });
  });

  test("editorial policy page visual baseline", async ({ page }) => {
    await openPage(page, "/editorial-policy");
    await expect(page).toHaveScreenshot("editorial-policy-page.png", {
      fullPage: true,
      animations: "disabled"
    });
  });
});
