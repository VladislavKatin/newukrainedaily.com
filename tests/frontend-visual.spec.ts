import { expect, test } from "@playwright/test";

async function openPage(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load");
}

test.describe("frontend visual baselines", () => {
  test("home page hero visual baseline", async ({ page }) => {
    await openPage(page, "/");
    const leadSection = page.getByText("Lead Story", { exact: true }).locator("..").locator("..");
    await expect(leadSection).toHaveScreenshot("home-hero.png", {
      animations: "disabled"
    });
  });

  test("news hub top visual baseline", async ({ page }) => {
    await openPage(page, "/news");
    const leadSection = page.getByText("Lead report", { exact: true }).locator("..").locator("..");
    await expect(leadSection).toHaveScreenshot("news-hub-top.png", {
      animations: "disabled"
    });
  });

  test("news hub cards grid visual baseline", async ({ page }) => {
    await openPage(page, "/news");
    const recentReportsSection = page.getByText("Recent reports", { exact: true }).locator("..").locator("..");
    await expect(recentReportsSection).toHaveScreenshot("news-hub-grid.png", {
      animations: "disabled"
    });
  });

  test("blog hub top visual baseline", async ({ page }) => {
    await openPage(page, "/blog");
    const blogTop = page.getByRole("heading", { name: "Analysis and explainers" }).locator("..").locator("..");
    await expect(blogTop).toHaveScreenshot("blog-hub-top.png", {
      animations: "disabled"
    });
  });

  test("donate page visual baseline", async ({ page }) => {
    await openPage(page, "/donate");
    await expect(page).toHaveScreenshot("donate-page.png", {
      fullPage: true,
      animations: "disabled"
    });
  });

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

  test("news article hero visual baseline", async ({ page }) => {
    await openPage(page, "/news/ukraine-discusses-maritime-security-collaboration-with-partners");
    const articleTop = page.locator("main article").first();
    await expect(articleTop).toHaveScreenshot("news-article-top.png", {
      animations: "disabled",
      mask: [
        page.getByText("Related News", { exact: true }),
        page.getByText("Get the next major Ukraine report", { exact: true })
      ]
    });
  });

  test("blog article hero visual baseline", async ({ page }) => {
    await openPage(page, "/blog/how-global-support-helps-ukrainian-families-rebuild-daily-life");
    const articleTop = page.locator("main article").first();
    await expect(articleTop).toHaveScreenshot("blog-article-top.png", {
      animations: "disabled",
      mask: [
        page.getByText("Related Posts", { exact: true }),
        page.getByText("Get the next major Ukraine report", { exact: true })
      ]
    });
  });
});
