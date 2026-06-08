import { describe, it, expect } from "vitest";
import {
  buildTitleCharIndex,
  searchTitlesByChars,
} from "@/lib/search/title-index";

describe("title-index", () => {
  const index = buildTitleCharIndex([
    { sutraId: "s1", cbetaId: "T08n0235", title: "金刚般若波罗蜜经" },
    { sutraId: "s2", cbetaId: "T85n2733", title: "御注金刚般若波罗蜜经宣演" },
    { sutraId: "s3", cbetaId: "T08n0251", title: "般若波罗蜜多心经" },
  ]);

  it("finds sutras by character intersection", () => {
    const hits = searchTitlesByChars(index, "金刚经");
    expect(hits.map((h) => h.cbetaId)).toContain("T08n0235");
    expect(hits.map((h) => h.cbetaId)).toContain("T85n2733");
  });

  it("requires minimum char match ratio", () => {
    const hits = searchTitlesByChars(index, "金刚", { minRatio: 1 });
    expect(hits.every((h) => h.title.includes("金刚"))).toBe(true);
  });
});
