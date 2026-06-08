/**
 * MVP 热门经目列表测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isMvpSutra, MVP_CANON } from "@/lib/cbeta/mvp-canon";

describe("isMvpSutra", () => {
  it("热门经目友好 slug 返回 true", () => {
    expect(isMvpSutra("xinjing")).toBe(true);
    expect(isMvpSutra("jingangjing")).toBe(true);
  });

  it("非热门 slug 返回 false", () => {
    expect(isMvpSutra("unknown-sutra")).toBe(false);
  });

  it("覆盖全部 MVP 热门列表", () => {
    for (const entry of MVP_CANON) {
      expect(isMvpSutra(entry.slug)).toBe(true);
    }
  });
});
