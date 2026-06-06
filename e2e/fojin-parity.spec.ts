import { test, expect } from "@playwright/test";

/**
 * FoJin 对标新路由 smoke 矩阵
 * @author jingxin
 */
test.describe("fojin parity routes", () => {
  test("homepage portal shows hero, stats and feature grid", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("home-hero")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("home-stats-bar")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("home-feature-grid")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: "静心", level: 1 })).toBeVisible();
  });

  test("nav shows active state on canon page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/canon", { waitUntil: "domcontentloaded" });
    const canonLink = page.getByRole("link", { name: "经藏" });
    await expect(canonLink).toHaveAttribute("aria-current", "page");
  });

  test("search page shows facet sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/search?q=菩提", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("search-facet-sidebar")).toBeVisible({ timeout: 15000 });
  });

  test("reader page shows icon toolbar", async ({ page }) => {
    await page.goto("/sutra/chang-a-han-jing", { waitUntil: "domcontentloaded" });
    const toolbar = page.getByTestId("reader-toolbar");
    const notFound = page.getByRole("heading", { name: /未找到|404/i });
    const hasToolbar = await toolbar.isVisible().catch(() => false);
    const is404 = await notFound.isVisible().catch(() => false);
    if (hasToolbar) {
      await expect(toolbar).toBeVisible();
      await expect(page.getByTestId("reader-tool-toc")).toBeVisible();
    } else {
      expect(is404).toBe(true);
    }
  });

  test("canon browse page renders", async ({ page }) => {
    await page.goto("/canon", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "经藏浏览" })).toBeVisible({ timeout: 15000 });
    const hasAccordion = await page.getByRole("button", { expanded: true }).first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText("暂无已导入经目").isVisible().catch(() => false);
    expect(hasAccordion || hasEmpty).toBe(true);
  });

  test("dictionary page accepts query", async ({ page }) => {
    await page.goto("/dictionary?q=菩提", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "佛学辞典" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("dict-search-input")).toBeVisible();
    await expect(
      page.getByTestId("dict-results").or(page.getByTestId("dict-empty")),
    ).toBeVisible({ timeout: 15000 });
  });

  test("kg page renders graph or empty fallback", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/kg", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "知识图谱" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("kg-main-search")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("kg-explorer-layout")).toBeVisible({ timeout: 30000 });
  });

  test("places page renders map area or empty fallback", async ({ page }) => {
    await page.goto("/places", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "佛教地理" })).toBeVisible({ timeout: 15000 });
    await expect(
      page
        .getByTestId("places-map-layout")
        .or(page.getByText("暂无地理坐标数据"))
        .or(page.getByText("暂无地理坐标数据。请联系管理员导入地名与坐标。")),
    ).toBeVisible({ timeout: 15000 });
  });

  test("chat page shows input and can send mock message", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByRole("heading", { level: 1, name: "AI 问经" })).toBeVisible();
    await expect(page.getByTestId("chat-empty-state")).toBeVisible();
    const input = page.getByRole("textbox", { name: "输入消息" });
    await expect(input).toBeEnabled();
    await input.fill("测试消息");
    await page.getByRole("button", { name: "发送消息" }).click();
    await expect(page.getByText(/【模拟回复】/)).toBeVisible({ timeout: 15000 });
  });

  test("discovery pages share consistent page header structure", async ({ page }) => {
    const routes: Array<{ path: string; heading: string }> = [
      { path: "/search", heading: "统一搜索" },
      { path: "/dictionary", heading: "佛学辞典" },
      { path: "/canon", heading: "经藏浏览" },
    ];

    for (const { path, heading } of routes) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const header = page.locator("header").filter({ has: page.getByRole("heading", { level: 1, name: heading }) });
      await expect(header).toBeVisible({ timeout: 15000 });
      await expect(header.locator(".jx-section-label")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });
});
