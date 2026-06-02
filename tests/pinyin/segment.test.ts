import { describe, it, expect, beforeEach } from "vitest";
import { segmentParagraph, toPlainText } from "@/lib/pinyin/segment";
import { resetDictCache } from "@/lib/pinyin/dict";

describe("pinyin segment", () => {
  beforeEach(() => {
    resetDictCache();
  });

  it("segments Heart Sutra opening with manual phrases", () => {
    const text = "觀自在菩薩，行深般若波羅蜜多時";
    const readings = segmentParagraph(text, { script: "traditional" });
    const plain = toPlainText(readings);
    expect(plain).toContain("guān");
    expect(plain).toContain("pú sà");
    expect(plain).toContain("bō rě");
  });

  it("reads 南无 as ná mó", () => {
    const readings = segmentParagraph("南無阿彌陀佛", { script: "traditional" });
    const plain = toPlainText(readings);
    expect(plain.startsWith("nán mó")).toBe(true);
    expect(plain).toContain("ā mí tuó fó");
  });

  it("reads 地藏 as dì zàng", () => {
    const plain = toPlainText(segmentParagraph("地藏菩薩"));
    expect(plain).toContain("dì zàng");
    expect(plain).toContain("pú sà");
  });

  it("uses manual 行 as héng in Buddhist context phrase", () => {
    const plain = toPlainText(segmentParagraph("行"));
    expect(plain).toBe("héng");
  });

  it("preserves punctuation without pinyin", () => {
    const readings = segmentParagraph("觀，空");
    expect(readings.some((r) => r.char === "，" && r.pinyin === "")).toBe(true);
    expect(readings.find((r) => r.char === "空")?.pinyin).toBe("kōng");
  });

  it("handles 神祇 with manual phrase", () => {
    const plain = toPlainText(segmentParagraph("神祇"));
    expect(plain).toBe("shén qí");
  });
});
