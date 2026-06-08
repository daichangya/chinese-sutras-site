import { describe, expect, it } from "vitest";
import { applySearchFilters, extractSearchCategories } from "@/lib/search/filter-results";
import type { UnifiedSearchResult } from "@/lib/search/types";

const sample: UnifiedSearchResult = {
  sutras: [
    {
      sutraId: "s1",
      sutraSlug: "a",
      title: "A",
      translator: null,
      category: "般若",
      cbetaId: "T01",
    },
    {
      sutraId: "s2",
      sutraSlug: "b",
      title: "B",
      translator: null,
      category: "涅槃",
      cbetaId: "T02",
    },
  ],
  paragraphs: [
    {
      paragraphId: "p1",
      sutraId: "s1",
      sutraSlug: "a",
      sutraTitle: "A",
      snippet: "x",
      seq: 1,
    },
    {
      paragraphId: "p2",
      sutraId: "s2",
      sutraSlug: "b",
      sutraTitle: "B",
      snippet: "y",
      seq: 1,
    },
  ],
  dictionary: [],
  persons: [],
};

describe("filter-results", () => {
  it("extracts unique categories", () => {
    expect(extractSearchCategories(sample)).toEqual(["般若", "涅槃"]);
  });

  it("filters by category", () => {
    const filtered = applySearchFilters(sample, { categories: ["般若"], colloquialOnly: false });
    expect(filtered.sutras).toHaveLength(1);
    expect(filtered.paragraphs).toHaveLength(1);
  });

  it("filters colloquial sutras", () => {
    const filtered = applySearchFilters(
      sample,
      { categories: [], colloquialOnly: true },
      new Set(["s1"]),
    );
    expect(filtered.sutras.map((s) => s.sutraId)).toEqual(["s1"]);
    expect(filtered.paragraphs.map((p) => p.paragraphId)).toEqual(["p1"]);
  });
});
