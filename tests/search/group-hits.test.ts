import { describe, it, expect } from "vitest";
import { groupHitsBySutra } from "@/lib/search/group-hits";
import type { SearchHit } from "@/lib/search/fts-types";

describe("groupHitsBySutra", () => {
  it("groups paragraph hits by sutra", () => {
    const hits: SearchHit[] = [
      {
        paragraphId: "p1",
        sutraId: "s1",
        sutraSlug: "xinjing",
        sutraTitle: "心经",
        cbetaId: "T08n0251",
        snippet: "a",
        seq: 1,
        wordcount: 2,
      },
      {
        paragraphId: "p2",
        sutraId: "s1",
        sutraSlug: "xinjing",
        sutraTitle: "心经",
        cbetaId: "T08n0251",
        snippet: "b",
        seq: 2,
        wordcount: 1,
      },
      {
        paragraphId: "p3",
        sutraId: "s2",
        sutraSlug: "jingang",
        sutraTitle: "金刚经",
        cbetaId: "T08n0235",
        snippet: "c",
        seq: 1,
        wordcount: 5,
      },
    ];
    const grouped = groupHitsBySutra(hits);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.cbetaId).toBe("T08n0235");
    expect(grouped[0]?.hits).toHaveLength(1);
    expect(grouped[1]?.hits).toHaveLength(2);
  });

  it("returns empty array for no hits", () => {
    expect(groupHitsBySutra([])).toEqual([]);
  });
});
