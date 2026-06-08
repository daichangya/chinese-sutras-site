import { test, expect, type Page } from "@playwright/test";

/**
 * 读者手册 16 路由 smoke 矩阵（有内容或合理空态）
 * @author 代长亚
 */

async function requireKgImported(page: Page) {
  const res = await page.request.get("/api/kg/stats");
  if (!res.ok()) {
    test.skip(true, "KG stats API unavailable");
    return false;
  }
  const stats = await res.json();
  if (!stats.totalEntities || stats.totalEntities < 1) {
    test.skip(true, "KG not imported — skipping entity route tests");
    return false;
  }
  return true;
}

test.describe("feature matrix smoke", () => {
  test("verse today page renders", async ({ page }) => {
    await page.goto("/verse/today", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("今日经句", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.locator("blockquote").first()).toBeVisible();
  });

  test("parallel reader when xinjing available", async ({ page }) => {
    await page.goto("/parallel/xinjing", { waitUntil: "domcontentloaded" });
    const notFound = await page.getByText("404").isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.getByText("平行阅读")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("chat sends message and receives mock reply", async ({ page }) => {
    await page.goto("/chat");
    const input = page.getByRole("textbox", { name: "输入消息" });
    await expect(input).toBeEnabled();
    await input.fill("什么是空性？");
    await page.getByRole("button", { name: "发送消息" }).click();
    await expect(page.getByText(/【模拟回复】|模拟解释/)).toBeVisible({ timeout: 15000 });
  });

  test("misrouted text slug redirects to sutra reader", async ({ page }) => {
    if (!(await requireKgImported(page))) return;
    await page.goto("/person/text-T08n0254", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sutra\/t08n0254/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "般若波罗蜜多心经" })).toBeVisible({
      timeout: 15000,
    });
  });

  test("person page shows name when kg imported", async ({ page }) => {
    if (!(await requireKgImported(page))) return;
    await page.goto("/person/dila-A000294", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "玄奘" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("person-bio")).toContainText("俗姓陈", { timeout: 15000 });
  });

  test("share page not found for unknown id", async ({ page }) => {
    await page.goto("/share/nonexistent-share-id-000", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByText("404").or(page.getByRole("heading", { name: /404|Not Found|未找到/i })),
    ).toBeVisible({ timeout: 15000 });
  });

  test("search facet hides colloquial filter when no colloquial data", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/search?q=空", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("search-facet-sidebar")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("仅有白话")).toHaveCount(0);
  });

  test("kg page shows edges when relations imported", async ({ page }) => {
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "知识图谱" })).toBeVisible({ timeout: 15000 });
    const hasGraph = await page.locator("svg").first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText("暂无图谱数据").isVisible().catch(() => false);
    expect(hasGraph || hasEmpty).toBe(true);
  });
});
