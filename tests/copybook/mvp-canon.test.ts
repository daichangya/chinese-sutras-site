/**
 * MVP 经目抄经支持测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { isMvpSutra, MVP_CANON } from "@/lib/cbeta/mvp-canon";

describe("isMvpSutra", () => {
  it("MVP 经典返回 true", () => {
    expect(isMvpSutra("xinjing")).toBe(true);
    expect(isMvpSutra("jingangjing")).toBe(true);
  });

  it("非 MVP slug 返回 false", () => {
    expect(isMvpSutra("unknown-sutra")).toBe(false);
  });

  it("覆盖全部 MVP 列表", () => {
    for (const entry of MVP_CANON) {
      expect(isMvpSutra(entry.slug)).toBe(true);
    }
  });
});
