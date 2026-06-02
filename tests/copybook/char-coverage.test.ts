/**
 * 字符覆盖率测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { checkCoverage, coveragePercent, type CoverageResult } from "@/components/copybook/char-coverage";

describe("checkCoverage", () => {
  it("空文本返回零结果", () => {
    const result = checkCoverage("", "xuandong");
    expect(result.total).toBe(0);
    expect(result.found).toBe(0);
    expect(result.missing).toHaveLength(0);
  });

  it("简体字在玄冬楷书中有覆盖", () => {
    const result = checkCoverage("观自在", "xuandong");
    expect(result.total).toBe(3);
    expect(result.found).toBeGreaterThan(0);
  });

  it("未知字体返回空覆盖", () => {
    const result = checkCoverage("测试", "unknown");
    expect(result.total).toBe(2);
    expect(result.missing).toHaveLength(2);
  });

  it("覆盖率百分比计算正确", () => {
    expect(coveragePercent({ total: 10, found: 8, missing: [], fontChoice: "xuandong" })).toBe(80);
    expect(coveragePercent({ total: 0, found: 0, missing: [], fontChoice: "xuandong" })).toBe(100);
  });
});
