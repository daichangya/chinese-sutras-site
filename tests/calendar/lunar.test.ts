/**
 * 农历换算
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { getLunarInfo } from "@/lib/calendar/lunar";

describe("lunar conversion", () => {
  it("converts 2026-06-13 to lunar April 28", () => {
    const lunar = getLunarInfo("2026-06-13");
    expect(lunar.month).toBe(4);
    expect(lunar.day).toBe(28);
    expect(lunar.monthLabel).toBe("四");
    expect(lunar.dayLabel).toBe("廿八");
  });

  it("converts 2026-05-24 to lunar April 8 (佛诞)", () => {
    const lunar = getLunarInfo("2026-05-24");
    expect(lunar.month).toBe(4);
    expect(lunar.day).toBe(8);
  });
});
