/**
 * 字库简繁归一匹配测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  charMatchesFont,
  listMissingChars,
  resolveGlyph,
} from "@/components/copybook/font-char-match";
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";
import { checkCoverage, coveragePercent } from "@/components/copybook/char-coverage";
import { s2t } from "@/lib/han";

describe("resolveGlyph", () => {
  const xuandong = COPYBOOK_CHAR_SETS.xuandong!;
  const aoyagi = COPYBOOK_CHAR_SETS.aoyagi!;

  it("玄冬：繁体 觀 归一到简体 观", () => {
    const r = resolveGlyph("觀", "xuandong", xuandong);
    expect(r.covered).toBe(true);
    expect(r.glyph).toBe("观");
  });

  it("青柳：简体 观 归一到繁体 觀", () => {
    const r = resolveGlyph("观", "aoyagi", aoyagi);
    expect(r.covered).toBe(true);
    expect(r.glyph).toBe("觀");
  });

  it("字库真缺字返回未覆盖", () => {
    const r = resolveGlyph("𠮷", "xuandong", xuandong);
    expect(r.covered).toBe(false);
  });
});

describe("checkCoverage with normalization", () => {
  it("玄冬 + 繁体心经片段覆盖率应显著高于裸匹配", () => {
    const sample = "觀自在菩薩行深般若波羅蜜多時照見五蘊皆空";
    const cov = checkCoverage(sample, "xuandong");
    expect(coveragePercent(cov)).toBeGreaterThanOrEqual(90);
  });

  it("listMissingChars 去重", () => {
    const missing = listMissingChars("觀觀", "xuandong");
    const unique = new Set(missing);
    expect(unique.size).toBe(missing.length);
  });
});

describe("xinjing coverage integration", () => {
  it("心经简体/繁体玄冬覆盖率均 > 95%", () => {
    const simp =
      "观自在菩萨行深般若波罗蜜多时照见五蕴皆空度一切苦厄舍利子色不异空空不异色";
    const trad = s2t(simp).text;
    expect(coveragePercent(checkCoverage(simp, "xuandong"))).toBeGreaterThanOrEqual(95);
    expect(coveragePercent(checkCoverage(trad, "xuandong"))).toBeGreaterThanOrEqual(95);
  });
});
