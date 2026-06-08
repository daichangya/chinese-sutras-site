import { describe, it, expect } from "vitest";
import {
  resolveSutraAlias,
  resolveAliasCbetaId,
  listSutraAliasKeys,
} from "@/lib/search/sutra-aliases";

describe("sutra-aliases", () => {
  it("resolves 金刚经 to canonical title", () => {
    expect(resolveSutraAlias("金刚经")).toBe("金剛般若波羅蜜經");
    expect(resolveSutraAlias("金剛經")).toBe("金剛般若波羅蜜經");
  });

  it("resolves alias cbeta id for MVP canon", () => {
    expect(resolveAliasCbetaId("金刚经")).toBe("T08n0235");
    expect(resolveAliasCbetaId("心经")).toBe("T08n0251");
  });

  it("returns null for unknown query", () => {
    expect(resolveSutraAlias("不存在经")).toBeNull();
  });

  it("has expected alias keys", () => {
    const keys = listSutraAliasKeys();
    expect(keys).toContain("金刚经");
    expect(keys).toContain("法华经");
  });
});
