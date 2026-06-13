/**
 * 斋日判定
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isSixFastingDay, isTenFastingDay } from "@/lib/calendar/fasting";

describe("fasting days", () => {
  it("marks six fasting lunar days", () => {
    for (const d of [8, 14, 15, 23, 29, 30]) {
      expect(isSixFastingDay(d)).toBe(true);
    }
    expect(isSixFastingDay(1)).toBe(false);
  });

  it("marks ten fasting lunar days", () => {
    for (const d of [1, 8, 14, 15, 18, 23, 24, 28, 29, 30]) {
      expect(isTenFastingDay(d)).toBe(true);
    }
    expect(isTenFastingDay(2)).toBe(false);
  });
});
