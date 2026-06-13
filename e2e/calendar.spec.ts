import { test, expect } from "@playwright/test";

test.describe("buddhist calendar", () => {
  test("calendar page renders month grid and today", async ({ page }) => {
    await page.goto("/calendar", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("buddhist-calendar")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("fasting-mode-toggle")).toBeVisible();
    await expect(page.getByTestId("calendar-today")).toBeVisible();
    await expect(page.getByTestId("calendar-day-detail")).toBeVisible();
  });

  test("can switch fasting mode", async ({ page }) => {
    await page.goto("/calendar", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "十斋日" }).click();
    await expect(page.getByRole("button", { name: "十斋日" })).toBeVisible();
  });

  test("shows month festival list when festivals exist", async ({ page }) => {
    await page.goto("/calendar", { waitUntil: "domcontentloaded" });
    const list = page.getByTestId("calendar-month-festivals");
    if (await list.isVisible().catch(() => false)) {
      await expect(list.getByRole("button").first()).toBeVisible();
    }
  });

  test("home shows buddhist date chip", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const chip = page.getByTestId("daily-verse-card").getByTestId("buddhist-date-chip");
    await chip.scrollIntoViewIfNeeded();
    await expect(chip).toBeVisible({ timeout: 15000 });
    await expect(chip).toContainText("佛历");
  });

  test("mobile header shows calendar sub-bar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const subBar = page.getByTestId("calendar-sub-bar");
    await expect(subBar).toBeVisible({ timeout: 15000 });
    await expect(subBar.getByTestId("buddhist-date-chip")).toContainText("佛历");
    await expect(
      page.locator("header .jx-shell").first().getByTestId("buddhist-date-chip"),
    ).toBeHidden();
  });
});
