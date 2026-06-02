import { describe, expect, it, beforeEach } from "vitest";
import { normalizeCbetaId } from "@/lib/cbeta/corpus-category";
import {
  extractZaijiaWorkIds,
  getZaijiaMeta,
  inferKindFromWorkLine,
  isPureSutraSubtreeHeader,
  listZaijiaIdsBySectionCode,
  loadZaijiaIndexes,
  resetZaijiaCategoryIndexCache,
} from "@/lib/cbeta/zaijia-category";

describe("normalizeCbetaId letter sutra numbers", () => {
  it("normalizes J31nB269 and standard ids", () => {
    expect(normalizeCbetaId("J31nB269")).toBe("J31nB269");
    expect(normalizeCbetaId("T05n0220")).toBe("T05n0220");
    expect(normalizeCbetaId("P187n1624")).toBe("P187n1624");
    expect(normalizeCbetaId("T08n0236a")).toBe("T08n0236a");
  });
});

describe("zaijia work id extraction", () => {
  beforeEach(() => {
    resetZaijiaCategoryIndexCache();
  });

  it("extracts J31nB269 from catalog line", () => {
    const line =
      "\t\t\tJ31nB269 金剛般若經疏論纂要刊定記會編 (10卷)【唐 宗密述疏　宋 子璿錄記　清 行策會編】";
    expect(extractZaijiaWorkIds(line)).toEqual(["J31nB269"]);
  });

  it("indexes J31nB269 under 03 般若部類", () => {
    const meta = getZaijiaMeta("J31nB269");
    expect(meta).toBeDefined();
    expect(meta?.sectionCode).toBe("03");
    expect(meta?.sectionLabel).toContain("般若");
    expect(meta?.kind).toBe("疏");
  });

  it("section 03 has at least 219 indexed ids including J31", () => {
    const ids = listZaijiaIdsBySectionCode("03");
    expect(ids).toContain("J31nB269");
    expect(ids.length).toBeGreaterThanOrEqual(219);
    const { categoryById } = loadZaijiaIndexes();
    expect(categoryById.get("J31nB269")).toBe("般若");
  });
});

describe("zaijia 经/疏解析", () => {
  beforeEach(() => {
    resetZaijiaCategoryIndexCache();
  });

  it("detects pure sutra subtree header", () => {
    expect(isPureSutraSubtreeHeader("\t\t\t\tT0262-65 法華經 T09a")).toBe(true);
    expect(isPureSutraSubtreeHeader("\t\tT0262-65 法華經／疏 T33-34")).toBe(false);
  });

  it("T09n0262 法华译本 → 经/法华", () => {
    const { categoryById } = loadZaijiaIndexes();
    const meta = getZaijiaMeta("T09n0262");
    expect(meta?.kind).toBe("经");
    expect(categoryById.get("T09n0262")).toBe("法华");
  });

  it("T33n1715 法华义记 → 疏/法华", () => {
    const { categoryById } = loadZaijiaIndexes();
    const meta = getZaijiaMeta("T33n1715");
    expect(meta?.kind).toBe("疏");
    expect(categoryById.get("T33n1715")).toBe("法华");
  });

  it("T85n2746 敦煌古逸 → 疏（zaijia 般若部類，磁盘归敦煌由 canonDept T sch 优先）", () => {
    const meta = getZaijiaMeta("T85n2746");
    expect(meta?.kind).toBe("疏");
    expect(meta?.sectionCode).toBe("03");
  });

  it("inferKindFromWorkLine: 译本 override 疏子树", () => {
    const line = "\t\t\t\tT09n0263 正法華經 (10卷)【西晉 竺法護譯】";
    expect(inferKindFromWorkLine(line, true)).toBe("经");
    const shuLine = "\t\t\t\tT33n1715 法華經義記 (8卷)【梁 法雲撰】";
    expect(inferKindFromWorkLine(shuLine, true)).toBe("疏");
    const lunShu = "\t\t\t\tX46n0791 大智度論疏 (7卷)【南北朝 慧影抄撰】";
    expect(inferKindFromWorkLine(lunShu, false)).toBe("疏");
  });
});
