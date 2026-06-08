import { describe, expect, it, beforeAll } from "vitest";
import {
  canonDeptFromCbetaId,
  categoryFromTitle,
  CORPUS_CATEGORIES,
  isModernXinbianCorpus,
  loadAuxiliaryCanonCategoryIndex,
  loadTaishoCategoryIndex,
  loadXuzangCategoryIndex,
  lookupAuxiliaryCanonCategory,
  lookupTaishoCategory,
  lookupXuzangCategory,
  resetTaishoCategoryIndexCache,
} from "@/lib/cbeta/corpus-category";
import { getBuleiMeta, resolveBuleiMeta } from "@/lib/cbeta/bulei-catalog";
import { buleiFieldsForCbetaId } from "@/lib/corpus-v3/meta";

describe("canonDeptFromCbetaId", () => {
  beforeAll(() => {
    resetTaishoCategoryIndexCache();
    const idx = loadTaishoCategoryIndex();
    expect(idx.size).toBeGreaterThan(1000);
    const xIdx = loadXuzangCategoryIndex();
    expect(xIdx.size).toBeGreaterThan(1000);
    const auxIdx = loadAuxiliaryCanonCategoryIndex();
    expect(auxIdx.size).toBeGreaterThan(100);
  });

  it("maps Taisho agama/prajna/huayan", () => {
    expect(canonDeptFromCbetaId("T01n0001")).toBe("阿含（小乘根本经典）");
    expect(canonDeptFromCbetaId("T08n0251")).toBe("般若");
    expect(canonDeptFromCbetaId("T10n0279")).toBe("华严");
  });

  it("maps split 大般若 T05/T06/T07 and letter variants", () => {
    expect(canonDeptFromCbetaId("T05n0220")).toBe("般若");
    expect(canonDeptFromCbetaId("T06n0220")).toBe("般若");
    expect(
      canonDeptFromCbetaId("T07n0220k", "大般若波罗蜜多经(第401卷-第600卷)"),
    ).toBe("般若");
  });

  it("maps 诸宗/续诸宗 T 著述 via bulei", () => {
    expect(canonDeptFromCbetaId("T46n1916", "释禅波罗蜜次第法门")).toBe("法华");
    expect(canonDeptFromCbetaId("T70n2296")).toBe("论集（杂论、通论）");
  });

  it("maps T37 阿弥陀经疏 via bulei 寶積部類疏→宝积", () => {
    expect(canonDeptFromCbetaId("T37n1757", "阿弥陀经疏")).toBe("宝积");
    const bm = getBuleiMeta("T37n1757");
    expect(bm?.sectionLabel).toBe("寶積部類");
    expect(bm?.kind).toBe("疏");
  });

  it("maps school categories", () => {
    expect(canonDeptFromCbetaId("T47n1957")).toBe("净土宗");
    expect(canonDeptFromCbetaId("T48n2001")).toBe("禅宗");
  });

  it("maps catalog and dunhuang (bulei 事彙 / T85 sch)", () => {
    expect(canonDeptFromCbetaId("T55n2145")).toBe("事汇（类书、辞典、法数典籍）");
    expect(canonDeptFromCbetaId("T85n2732")).toBe("敦煌写本（敦煌出土古写经）");
  });

  it("maps non-T series", () => {
    expect(canonDeptFromCbetaId("D64n9031")).toBe("国图善本（扩展类目）");
    expect(canonDeptFromCbetaId("GA015n0013")).toBe("史传（僧传、寺志、编年史料）");
    expect(canonDeptFromCbetaId("B01n0001")).toBe("新编（新增及近现代文献）");
  });

  it("maps X 卍续 via bulei (般若部類疏→般若)", () => {
    expect(canonDeptFromCbetaId("X26n0551", "般若心經發隱")).toBe("般若");
    expect(canonDeptFromCbetaId("X26n0529", "般若心經疏")).toBe("般若");
  });

  it("maps X 卍续 via bulei (般若部類义疏→般若)", () => {
    expect(canonDeptFromCbetaId("X24n0451", "大品經義疏")).toBe("般若");
  });

  it("prefers bulei over sutra_sch for X 般若科仪 (X74n1494→般若)", () => {
    expect(lookupXuzangCategory("X74n1494")).toBe("宗教（总类 / 总论）");
    expect(canonDeptFromCbetaId("X74n1494", "金刚经科仪")).toBe("般若");
  });

  it("maps by title when not in bulei", () => {
    expect(canonDeptFromCbetaId("X70n1400", "高峰原妙禪師語錄")).toBe("禅宗");
    expect(categoryFromTitle("般若心經發隱")).toBe("论集（杂论、通论）");
    expect(categoryFromTitle("道行般若經")).toBe("般若");
  });

  it("maps X 卍续 via bulei over sutra_sch when listed", () => {
    expect(lookupXuzangCategory("X14n0292")).toBe("论集（杂论、通论）");
    expect(canonDeptFromCbetaId("X14n0292", "楞严经击节")).toBe("密教（真言宗、陀罗尼、仪轨）");
    expect(canonDeptFromCbetaId("X03n0208", "华严经论")).toBe("华严");
    expect(canonDeptFromCbetaId("X69n1322")).toBe("禅宗");
    expect(categoryFromTitle("楞严经击节")).toBe("论集（杂论、通论）");
  });

  it("keeps modern series in 新编 via isModernXinbianCorpus", () => {
    expect(isModernXinbianCorpus("YP01n0001", "某研究")).toBe(true);
    expect(isModernXinbianCorpus("X14n0292", "楞严经击节")).toBe(false);
    expect(canonDeptFromCbetaId("YP01n0001", "近现代文献")).toBe("新编（新增及近现代文献）");
  });

  it("every mapped category is in CORPUS_CATEGORIES", () => {
    const idx = loadTaishoCategoryIndex();
    for (const cat of idx.values()) {
      expect(CORPUS_CATEGORIES).toContain(cat);
    }
  });

  it("maps A 金藏 catalog works via bulei 事彙部類", () => {
    expect(lookupAuxiliaryCanonCategory("A097n1267")).toBe("宗教（总类 / 总论）");
    expect(
      canonDeptFromCbetaId("A097n1267", "大唐开元释教广品历章(第3卷-第4卷)"),
    ).toBe("事汇（类书、辞典、法数典籍）");
    expect(isModernXinbianCorpus("A097n1267", "大唐开元释教广品历章")).toBe(false);
    expect(canonDeptFromCbetaId("A110n1490", "天圣释教总录")).toBe("事汇（类书、辞典、法数典籍）");
  });

  it("maps T45 三論惟識宗 via taisho sch not 新编", () => {
    expect(lookupTaishoCategory("T45n1852")).toBe("中观（三论宗）");
    expect(canonDeptFromCbetaId("T45n1852", "三論玄義")).toBe("中观（三论宗）");
  });

  it("unknown traditional corpus does not fall back to 新编", () => {
    expect(canonDeptFromCbetaId("Z99n0001", "某佚失经")).not.toBe("新编（新增及近现代文献）");
    expect(canonDeptFromCbetaId("A114n1504", "佛说大乘僧伽咤法义经")).not.toBe(
      "新编（新增及近现代文献）",
    );
  });

  it("maps F03 御注金刚经 via bulei 般若部類疏→般若", () => {
    expect(
      canonDeptFromCbetaId("F03n0100", "金刚般若波罗蜜经（御注并序）"),
    ).toBe("般若");
    const bm = resolveBuleiMeta("F03n0100");
    expect(bm?.sectionLabel).toBe("般若部類");
    expect(bm?.kind).toBe("疏");
  });

  it("keeps T85 御注宣演 as 敦煌 via taisho sch before bulei", () => {
    expect(canonDeptFromCbetaId("T85n2733", "御注金刚般若波罗蜜经宣演")).toBe(
      "敦煌写本（敦煌出土古写经）",
    );
  });

  it("exposes bulei meta subcategories", () => {
    const bm = getBuleiMeta("X26n0551");
    expect(bm?.sectionLabel).toBe("般若部類");
    expect(bm?.kind).toBe("疏");
    const bf = buleiFieldsForCbetaId("X26n0551");
    expect(bf?.section).toBe("般若部类");
    expect(bf?.kind).toBe("疏");
    expect(bf?.group).toMatch(/般若心经/);
  });
});
