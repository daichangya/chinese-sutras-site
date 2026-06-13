/**
 * 微信登录 Mock 流程 E2E
 * @author 代长亚
 */
import { test, expect } from "@playwright/test";

test.describe("auth mock login", () => {
  test("mock oauth creates session and shows account page", async ({ page, request }) => {
    const mockRes = await request.post("/api/auth/wechat/mock", {
      data: { returnTo: "/account" },
    });
    expect(mockRes.ok()).toBeTruthy();
    const { url } = (await mockRes.json()) as { url: string };

    await page.goto(url);
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole("heading", { name: "个人中心" })).toBeVisible();

    const sessionRes = await request.get("/api/auth/session");
    const session = (await sessionRes.json()) as { loggedIn: boolean; user?: { nickname?: string } };
    expect(session.loggedIn).toBe(true);
    expect(session.user?.nickname).toBeTruthy();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "微信登录" })).toBeVisible();
  });
});
