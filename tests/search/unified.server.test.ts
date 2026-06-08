import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { normalizeCbetaId } from "@/lib/cbeta/corpus-category";

const hasDb = fs.existsSync(path.join(process.cwd(), "data/jingxin.db"));

describe.skipIf(!hasDb)("searchSutras integration", () => {
  beforeAll(() => {
    process.env.DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  });

  it("returns empty for blank query", async () => {
    const { searchSutras } = await import("@/lib/search/unified");
    expect(searchSutras("")).toEqual([]);
    expect(searchSutras("   ")).toEqual([]);
  });

  it("ranks T08n0235 first for 金刚经", async () => {
    const { searchSutras } = await import("@/lib/search/unified");
    const hits = searchSutras("金刚经", 12);
    expect(hits.length).toBeGreaterThan(0);
    expect(normalizeCbetaId(hits[0]!.cbetaId)).toBe("T08n0235");
  });

  it("direct lookup for T08n0235", async () => {
    const { searchSutras } = await import("@/lib/search/unified");
    const hits = searchSutras("T08n0235", 5);
    expect(hits).toHaveLength(1);
    expect(normalizeCbetaId(hits[0]!.cbetaId)).toBe("T08n0235");
  });

  it(
    "unified search returns sutras and paragraphs for 金刚经",
    async () => {
      const { unifiedSearch } = await import("@/lib/search/unified");
      const result = unifiedSearch("金刚经");
      expect(normalizeCbetaId(result.sutras[0]!.cbetaId)).toBe("T08n0235");
      expect(result.paragraphs.length).toBeGreaterThan(0);
    },
    30_000,
  );

  it("returns multiple translator editions for 般若波罗蜜多心经", async () => {
    const { searchSutras } = await import("@/lib/search/unified");
    const hits = searchSutras("般若波罗蜜多心经", 12);
    const exact = hits.filter((h) => h.title === "般若波罗蜜多心经");
    expect(exact.length).toBeGreaterThanOrEqual(4);
    expect(exact.map((h) => h.cbetaId.toUpperCase()).slice(0, 4)).toEqual(
      expect.arrayContaining(["T08N0251", "T08N0253", "T08N0254", "T08N0255"]),
    );
    const cbetaIds = new Set(exact.map((h) => h.cbetaId.toUpperCase()));
    expect(cbetaIds.has("T08N0251")).toBe(true);
    expect(cbetaIds.has("T08N0253")).toBe(true);
    expect(cbetaIds.has("T08N0254")).toBe(true);
    expect(cbetaIds.has("T08N0255")).toBe(true);
  });

  it("does not put text KG entities in persons for sutra title query", async () => {
    const { unifiedSearch } = await import("@/lib/search/unified");
    const result = unifiedSearch("般若波罗蜜多心经");
    expect(result.sutras.length).toBeGreaterThan(0);
    expect(result.persons.every((p) => !p.slug.startsWith("text-"))).toBe(true);
    expect(result.persons.every((p) => !p.nameZh.includes("般若波罗蜜多心经"))).toBe(true);
  });
});
