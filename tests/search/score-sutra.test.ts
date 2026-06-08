import { describe, it, expect } from "vitest";
import { scoreSutraHit, mergeSutraHits } from "@/lib/search/score-sutra";
import type { SutraSearchHit } from "@/lib/search/types";

const canon: SutraSearchHit = {
  sutraId: "c1",
  sutraSlug: "jingangjing",
  title: "金刚般若波罗蜜经",
  translator: "鸠摩罗什",
  category: "般若部",
  cbetaId: "T08n0235",
};

const derivative: SutraSearchHit = {
  sutraId: "d1",
  sutraSlug: "x",
  title: "御注金刚般若波罗蜜经宣演",
  translator: null,
  category: "疑似部",
  cbetaId: "T85n2733",
};

describe("scoreSutraHit", () => {
  it("prefers canon over derivative for same alias intent", () => {
    const canonScore = scoreSutraHit(canon, "alias");
    const derivScore = scoreSutraHit(derivative, "char_index");
    expect(canonScore).toBeGreaterThan(derivScore);
  });

  it("merge keeps highest score per sutra", () => {
    const merged = mergeSutraHits([
      { hits: [derivative], source: "char_index" },
      { hits: [canon], source: "alias" },
    ]);
    expect(merged[0]?.cbetaId).toBe("T08n0235");
  });
});
