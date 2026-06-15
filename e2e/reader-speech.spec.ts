import { test, expect, type Page } from "@playwright/test";

async function expandReaderFab(page: Page) {
  await page.getByTestId("reader-fab-toggle").click();
  await expect(page.getByTestId("reader-fab-actions")).toBeVisible();
}

test.describe("reader speech", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      class FakeUtterance {
        text: string;
        lang = "zh-CN";
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: SpeechSynthesisErrorEvent) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }

      const synth = {
        speak(utterance: FakeUtterance) {
          window.setTimeout(() => utterance.onend?.(), 200);
        },
        cancel() {},
        pause() {},
        resume() {},
        getVoices: () => [] as SpeechSynthesisVoice[],
      };

      Object.defineProperty(window, "speechSynthesis", { value: synth });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance });
    });
  });

  test("does not auto-start speech on page load", async ({ page }) => {
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("reader-fab")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);
    await expect(page.getByTestId("reader-speech-bar")).toHaveCount(0);
    await expect(page.locator(".jx-speech-active")).toHaveCount(0);
  });

  test("fab stays reachable after scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("reader-fab")).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByTestId("reader-fab-toggle")).toBeVisible();
    await expandReaderFab(page);
    await expect(page.getByTestId("reader-tool-speech")).toBeVisible();
  });

  test("mobile reader shows speech bar after starting read aloud", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("reader-fab")).toBeVisible({ timeout: 15000 });
    await expandReaderFab(page);
    await page.getByTestId("reader-tool-speech").click();

    const bar = page.getByTestId("reader-speech-bar");
    await expect(bar).toBeVisible({ timeout: 10000 });
    await expect(bar.getByTestId("reader-speech-play")).toBeVisible();
    await expect(page.locator(".jx-speech-active")).toHaveCount(1, { timeout: 10000 });
  });

  test("speech bar exposes skip controls while playing", async ({ page }) => {
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    await expandReaderFab(page);
    await page.getByTestId("reader-tool-speech").click();
    const bar = page.getByTestId("reader-speech-bar");
    await expect(bar).toBeVisible({ timeout: 10000 });
    await expect(bar.getByTestId("reader-speech-next")).toBeVisible();
    await expect(bar.getByTestId("reader-speech-prev")).toBeVisible();
  });

  test("high quality engine option visible by default", async ({ page }) => {
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    await page.waitForResponse(
      (r) => r.url().includes("/api/reader/tts") && r.request().method() === "GET",
    );
    await expandReaderFab(page);
    await page.getByTestId("reader-settings-menu").click();
    await expect(page.getByTestId("reader-settings-speech-engine")).toBeVisible();
    await expect(page.getByTestId("reader-settings-speech-rate")).toBeVisible();
  });

  test("context menu opens share dialog on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sutra/xinjing", { waitUntil: "domcontentloaded" });
    await page.locator("#reader-content").click({ button: "right" });
    await expect(page.getByTestId("reader-context-menu")).toBeVisible();
    await page.getByTestId("reader-context-share").click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
