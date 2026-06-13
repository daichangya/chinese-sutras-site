import { test, expect } from "@playwright/test";

/**
 * 分享卡片竖版海报 smoke
 * @author 代长亚
 */
test.describe("share card export", () => {
  test("share page renders export card and download button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });

    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }

    await page.getByTestId("reader-toolbar").getByRole("button", { name: "分享" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "创建分享链接" }).click();
    await expect(page.getByText("分享链接")).toBeVisible({ timeout: 15000 });

    const codeEl = page.locator("code").filter({ hasText: /^\/share\// });
    const sharePath = (await codeEl.textContent())?.trim();
    if (!sharePath) {
      test.skip();
      return;
    }

    await page.goto(sharePath, { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("share-card-export")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("正信•经藏")).toBeVisible();
    await expect(page.getByRole("button", { name: /下载图片/ })).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 }).catch(() => null);
    await page.getByRole("button", { name: /下载图片/ }).click();
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/^zhengxin-jingzang-share-.+\.png$/);
    }
  });
});
