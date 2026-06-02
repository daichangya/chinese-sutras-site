import { test, expect } from "@playwright/test";

test.describe("jingxin smoke", () => {
  test("home shows title and popular or empty hint", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "让佛经更容易读懂" })).toBeVisible();
    await expect(page.getByTestId("daily-verse-card")).toBeVisible();
    // popular-sutra-grid only renders when there's data; check for either
    const hasGrid = await page.getByTestId("popular-sutra-grid").isVisible().catch(() => false);
    const hasEmpty = await page.getByText("暂无经文数据").isVisible().catch(() => false);
    expect(hasGrid || hasEmpty).toBe(true);
  });

  test("search page accepts query", async ({ page }) => {
    await page.goto("/search?q=空");
    await expect(page.getByRole("heading", { name: "搜索经文" })).toBeVisible();
    const hasResults = await page.getByTestId("search-results").isVisible().catch(() => false);
    const hasEmpty = await page.getByTestId("search-empty").isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test("bookmarks page shows empty or list", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible();
    await expect(page.getByTestId("bookmarks-list").or(page.getByText("暂无收藏"))).toBeVisible();
  });

  test("about page has CBETA attribution", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("link", { name: "CBETA 版权说明" })).toBeVisible();
  });

  test("reader flow when xinjing imported", async ({ page }) => {
    await page.goto("/sutra/xinjing");
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.locator("article#reader-content")).toBeVisible();
    await expect(page.getByTestId("reader-ai-panel")).toBeVisible();
  });

  test("copybook flow when xinjing imported", async ({ page }) => {
    await page.goto("/sutra/xinjing");
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await page.getByTestId("reader-copybook-link").click();
    await expect(page).toHaveURL(/\/sutra\/xinjing\/copybook/);
    await expect(page.getByTestId("copybook-config")).toBeVisible();
    await page.getByTestId("copybook-write-mode").selectOption("miaohong");
    await page.getByTestId("copybook-generate").click();
    await expect(page.getByTestId("copybook-canvas")).toBeVisible({ timeout: 15000 });
  });

  test("topic kongxing has intro hero", async ({ page }) => {
    await page.goto("/topic/kongxing");
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.getByRole("heading", { name: "空性" })).toBeVisible();
    // topic-sutra-list is always rendered (with empty state fallback)
    const listEl = page.getByTestId("topic-sutra-list");
    await expect(listEl).toBeVisible();
  });
});
