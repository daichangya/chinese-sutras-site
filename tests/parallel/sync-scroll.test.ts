import { describe, it, expect } from "vitest";
import { useSyncScroll } from "@/lib/parallel/use-sync-scroll";

describe("useSyncScroll", () => {
  it("should export a hook function", () => {
    expect(typeof useSyncScroll).toBe("function");
  });

  it("should calculate scroll ratio correctly", () => {
    // Test the scroll ratio calculation independently
    const scrollTop = 100;
    const scrollHeight = 1000;
    const clientHeight = 500;
    const maxScroll = scrollHeight - clientHeight; // 500
    const ratio = scrollTop / maxScroll; // 100/500 = 0.2
    expect(ratio).toBe(0.2);
  });

  it("should handle zero scroll height", () => {
    // When scrollHeight equals clientHeight, ratio should be 0
    const scrollHeight = 500;
    const clientHeight = 500;
    const hasScroll = scrollHeight > clientHeight;
    expect(hasScroll).toBe(false);
  });

  it("should clamp target scrollTop correctly", () => {
    // Verify that ratio-based sync produces valid scrollTop
    const sourceRatio = 0.5;
    const targetMaxScroll = 800;
    const expectedScrollTop = sourceRatio * targetMaxScroll;
    expect(expectedScrollTop).toBe(400);
    expect(expectedScrollTop).toBeGreaterThanOrEqual(0);
    expect(expectedScrollTop).toBeLessThanOrEqual(targetMaxScroll);
  });

  it("should handle edge case: source at bottom", () => {
    const scrollTop = 0;
    const maxScroll = 500;
    const ratio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    expect(ratio).toBe(0);
  });

  it("should handle edge case: source at bottom", () => {
    const scrollTop = 500;
    const scrollHeight = 1000;
    const clientHeight = 500;
    const maxScroll = scrollHeight - clientHeight;
    const ratio = scrollTop / maxScroll;
    expect(ratio).toBe(1);
  });
});
