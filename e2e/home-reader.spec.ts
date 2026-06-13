import { test, expect } from "@playwright/test";

test.describe("jingxin smoke", () => {
  test("home shows title and portal hero", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("home-hero")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "正信•经藏", level: 1 })).toBeVisible();
    await expect(page.getByTestId("home-hero").getByText("让佛经更容易读懂")).toBeVisible();
    await expect(page.getByTestId("home-stats-bar")).toBeVisible();
    await expect(page.getByTestId("home-feature-grid")).toBeVisible();
    await expect(
      page.getByTestId("home-feature-grid").getByRole("link", { name: /AI 问经/ }),
    ).toBeVisible();
    await page.getByTestId("daily-verse-card").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("daily-verse-card")).toBeVisible();
    await expect(
      page.getByTestId("daily-verse-card").getByTestId("buddhist-date-chip"),
    ).toBeVisible();
    await expect(
      page.getByTestId("daily-verse-card").getByTestId("buddhist-date-chip"),
    ).toContainText("佛历");
  });

  test("search page accepts query", async ({ page }) => {
    await page.goto("/search?q=空", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "统一搜索" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /经目/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /段落/ })).toBeVisible();
    const hasResults = await page.getByTestId("search-results").isVisible().catch(() => false);
    const hasEmpty = await page.getByTestId("search-empty").isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test("search form submits q from empty search page", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page.getByTestId("search-input").fill("金刚经");
    await page.getByRole("button", { name: "搜索" }).click();
    await page.waitForURL(/[?&]q=/, { timeout: 10000 });
    expect(new URL(page.url()).searchParams.get("q")).toBe("金刚经");
    await expect(page.getByRole("button", { name: /经目/ })).toBeVisible({ timeout: 15000 });
    const hasResults = await page.getByTestId("search-results").isVisible().catch(() => false);
    const hasEmpty = await page.getByTestId("search-empty").isVisible().catch(() => false);
    expect(hasResults || hasEmpty).toBe(true);
  });

  test("bookmarks page shows empty or list", async ({ page }) => {
    await page.goto("/bookmarks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("bookmarks-list").or(page.getByText("暂无收藏"))).toBeVisible();
  });

  test("about page has CBETA attribution", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "CBETA 版权说明" })).toBeVisible({ timeout: 15000 });
  });

  test("reader flow when xinjing imported", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.locator("article#reader-content")).toBeVisible();
    await expect(page.getByTestId("reader-toolbar")).toBeVisible();
    await expect(page.getByTestId("reader-comprehension-panel")).toBeVisible();
    await expect(page.getByTestId("reader-tool-comprehension")).toBeHidden();
    await expect(page.getByTestId("reader-tool-toc")).toBeHidden();
  });

  test("reader selection triggers AI modern explanation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }

    const article = page.locator("article#reader-content");
    await expect(article).toBeVisible();

    const paragraph = article.locator("p").filter({ hasText: /观自在|觀自在/ }).first();
    await paragraph.scrollIntoViewIfNeeded();
    await paragraph.selectText();

    await expect(page.getByTestId("reader-ai-selection")).toContainText("观自在", {
      timeout: 5000,
    });
    await expect(page.getByTestId("reader-ai-modern")).not.toHaveText("加载中…", {
      timeout: 20000,
    });
  });

  test("copybook flow when xinjing imported", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
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
    await page.goto("/topic/kongxing", { waitUntil: "domcontentloaded" });
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
