import { describe, it, expect } from "vitest";
import { normalizeCbetaId } from "@/lib/cbeta/corpus-category";
import { getPagerankOrder, compareSutraByCanonRank } from "@/lib/search/sutra-pagerank";

describe("sutra-pagerank", () => {
  it("ranks T08n0235 ahead of T85 derivative", () => {
    const r235 = getPagerankOrder("T08n0235");
    const r733 = getPagerankOrder("T85n2733");
    expect(r235).not.toBeNull();
    expect(r733).not.toBeNull();
    expect(r235!).toBeLessThan(r733!);
    expect(compareSutraByCanonRank("T08n0235", "T85n2733")).toBeLessThan(0);
  });

  it("downranks commented pagerank entries", () => {
    const r237 = getPagerankOrder("T08n0237");
    const r235 = getPagerankOrder("T08n0235");
    expect(r237).not.toBeNull();
    expect(r235!).toBeLessThan(r237!);
  });
});
