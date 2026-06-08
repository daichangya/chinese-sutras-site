import { test, expect } from "@playwright/test";

/**
 * 书签链接 404 回归
 * @author 代长亚
 */
test.describe("bookmarks 404 guard", () => {
  test("bookmarks API includes sutra slug fields", async ({ request }) => {
    const res = await request.get("/api/bookmarks");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    for (const bookmark of data.bookmarks ?? []) {
      if (bookmark.sutraId) {
        expect(
          bookmark.sutraSlug,
          `bookmark ${bookmark.id} should include sutraSlug`,
        ).toBeTruthy();
        expect(
          bookmark.sutraTitle,
          `bookmark ${bookmark.id} should include sutraTitle`,
        ).toBeTruthy();
      }
    }
  });

  test("bookmarks page avoids /sutra/ empty href", async ({ page }) => {
    await page.goto("/bookmarks", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "我的收藏" })).toBeVisible({
      timeout: 15000,
    });

    const links = page.locator('[data-testid="bookmarks-list"] a[href^="/sutra/"]');
    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).not.toBe("/sutra/");
      expect(href?.endsWith("/sutra/")).toBe(false);
    }
  });
});
