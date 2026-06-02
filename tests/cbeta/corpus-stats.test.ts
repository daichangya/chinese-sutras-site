import { describe, expect, it } from "vitest";
import { CORPUS_CATEGORIES, canonDeptFromCbetaId } from "@/lib/cbeta/corpus-category";

describe("corpus stats invariants", () => {
  it("23 category buckets sum to sample size", () => {
    const ids = ["T01n0001", "T08n0251", "T10n0279", "D64n9031", "B01n0001"];
    const counts = new Map<string, number>();
    for (const id of ids) {
      const cat = canonDeptFromCbetaId(id);
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    const sum = [...counts.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBe(ids.length);
    for (const c of counts.keys()) {
      expect(CORPUS_CATEGORIES).toContain(c);
    }
  });
});
