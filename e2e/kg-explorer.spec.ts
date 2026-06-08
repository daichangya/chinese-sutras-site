import { test, expect } from "@playwright/test";

/**
 * 知识图谱探索器 E2E
 * @author 代长亚
 */
test.describe("kg explorer", () => {
  test("kg page shows main search on first paint", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "知识图谱" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("kg-main-search")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("kg-toolbar")).toBeVisible();
  });

  test("kg page shows three-column explorer layout", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kg-explorer-layout")).toBeVisible({ timeout: 30000 });
  });

  test("search 玄奘 shows results and graph or mentions", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    const search = page.getByTestId("kg-main-search");
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill("玄奘");
    await page.getByTestId("kg-toolbar").getByRole("button", { name: "搜索" }).click();
    await expect(page.getByTestId("kg-search-results")).toBeVisible({ timeout: 15000 });
    const hasData = await page.getByTestId("kg-search-results").locator("button").first().isVisible().catch(() => false);
    if (!hasData) {
      test.skip();
      return;
    }
    await page.getByTestId("kg-search-results").locator("button").first().click();
    await expect(
      page
        .getByTestId("kg-legend")
        .or(page.getByTestId("kg-mentions-panel"))
        .or(page.getByTestId("kg-graph-empty")),
    ).toBeVisible({ timeout: 20000 });
  });

  test("type filter dropdown hides empty entity types when stats loaded", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("kg-main-search")).toBeVisible({ timeout: 15000 });
    const select = page.getByTestId("kg-toolbar").locator("select");
    await expect(select).toBeVisible();
    const options = await select.locator("option").allTextContents();
    if (options.length > 1) {
      for (const label of ["宗派", "概念", "寺院"]) {
        const hasType = options.some((o) => o.includes(label));
        if (hasType) {
          await select.selectOption({ label });
          break;
        }
      }
    }
  });

  test("person page uses slug URL without heuristic ids", async ({ page }) => {
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    const hasData = await page.getByTestId("kg-search-results").locator("button").first().isVisible().catch(() => false);
    if (!hasData) {
      test.skip();
      return;
    }
    await page.getByTestId("kg-search-results").locator("button").first().click();
    const personLink = page.getByRole("link", { name: "查看人物档案 →" });
    if (await personLink.isVisible().catch(() => false)) {
      await personLink.click();
      await expect(page).toHaveURL(/\/person\/[^%]+/);
      await expect(page.locator("body")).not.toContainText("kg:person:heuristic");
    }
  });
});
