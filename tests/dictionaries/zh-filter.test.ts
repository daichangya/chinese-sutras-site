/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isChineseHeadword } from "@/lib/dictionaries/zh-filter";
import { getZhDilaImportSources } from "@/lib/dictionaries/sources";

describe("zh-filter", () => {
  it("detects Chinese headwords", () => {
    expect(isChineseHeadword("般若")).toBe(true);
    expect(isChineseHeadword("buddhaḥ")).toBe(false);
  });

  it("zh batch excludes bilingual Soothill", () => {
    expect(getZhDilaImportSources().map((s) => s.code)).toEqual(["dingfubao", "nanshanlu"]);
  });
});
