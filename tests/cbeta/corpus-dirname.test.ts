import { describe, expect, it } from "vitest";
import {
  canonDeptFromCbetaId,
  categoryFromCorpusDir,
  corpusDirName,
  CORPUS_CATEGORIES,
} from "@/lib/cbeta/corpus-category";

describe("corpusDirName", () => {
  it("replaces slash with fullwidth slash for filesystem", () => {
    expect(corpusDirName("宗教（总类 / 总论）")).toBe("宗教（总类／总论）");
    expect(corpusDirName("瑜伽（唯识宗 / 法相宗）")).toBe("瑜伽（唯识宗／法相宗）");
    expect(corpusDirName("般若")).toBe("般若");
  });

  it("round-trips via categoryFromCorpusDir", () => {
    for (const c of CORPUS_CATEGORIES) {
      expect(categoryFromCorpusDir(corpusDirName(c))).toBe(c);
    }
  });

  it("canon dept uses safe dirs for split-prone categories", () => {
    expect(corpusDirName(canonDeptFromCbetaId("T55n2145"))).not.toContain("/");
    expect(corpusDirName(canonDeptFromCbetaId("T47n1957"))).not.toContain("/");
  });
});
