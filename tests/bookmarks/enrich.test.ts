/**
 * 书签经目元数据解析
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { resolveBookmarkSutraMeta } from "@/lib/bookmarks/enrich";

describe("resolveBookmarkSutraMeta", () => {
  it("prefers MVP friendly slug when cbeta id is in canon", () => {
    expect(
      resolveBookmarkSutraMeta("t08n0251", "般若波羅蜜多心經", "T08n0251"),
    ).toEqual({
      sutraSlug: "xinjing",
      sutraTitle: "般若波羅蜜多心經",
    });
  });

  it("falls back to db slug when cbeta id is not in MVP canon", () => {
    expect(resolveBookmarkSutraMeta("t08n0999", "某经", "T08n0999")).toEqual({
      sutraSlug: "t08n0999",
      sutraTitle: "某经",
    });
  });

  it("returns empty strings when sutra row is missing", () => {
    expect(resolveBookmarkSutraMeta(null, null, null)).toEqual({
      sutraSlug: "",
      sutraTitle: "",
    });
  });
});
