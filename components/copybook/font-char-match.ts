/**
 * 碑帖字库简繁归一匹配（覆盖率与渲染用字形）
 * @author 代长亚
 */
import type { CopybookFontChoice } from "@/components/copybook/grid-renderer";
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";
import { copybookS2t, copybookT2s } from "@/lib/copybook/opencc-js-client";

export type GlyphResolve = {
  /** Canvas fillText 使用的字形（可能与输入码点不同，如 觀 → 观） */
  glyph: string;
  /** 碑帖字库是否覆盖（含简繁归一） */
  covered: boolean;
};

/** 单字是否在字库中（含简繁归一） */
export function charMatchesFont(
  char: string,
  fontChoice: CopybookFontChoice,
  charSet: Set<string>,
): boolean {
  return resolveGlyph(char, fontChoice, charSet).covered;
}

/** 解析抄经用字形：优先原字，再按字体简繁策略查等价字 */
export function resolveGlyph(
  char: string,
  fontChoice: CopybookFontChoice,
  charSet: Set<string>,
): GlyphResolve {
  if (!char.trim()) return { glyph: char, covered: false };
  if (charSet.has(char)) return { glyph: char, covered: true };

  if (fontChoice === "xuandong") {
    const simp = copybookT2s(char);
    if (simp !== char && charSet.has(simp)) return { glyph: simp, covered: true };
  } else if (fontChoice === "aoyagi") {
    const trad = copybookS2t(char);
    if (trad !== char && charSet.has(trad)) return { glyph: trad, covered: true };
  } else if (fontChoice === "qiji") {
    const simp = copybookT2s(char);
    if (simp !== char && charSet.has(simp)) return { glyph: simp, covered: true };
    const trad = copybookS2t(char);
    if (trad !== char && charSet.has(trad)) return { glyph: trad, covered: true };
  }

  return { glyph: char, covered: false };
}

/** 列出字库仍无法覆盖的字（去重保序） */
export function listMissingChars(text: string, fontChoice: CopybookFontChoice): string[] {
  const charSet = COPYBOOK_CHAR_SETS[fontChoice];
  if (!charSet) return [...text].filter((c) => c.trim());

  const missing: string[] = [];
  const seen = new Set<string>();
  for (const c of text) {
    if (!c.trim() || seen.has(c)) continue;
    if (!charMatchesFont(c, fontChoice, charSet)) {
      missing.push(c);
      seen.add(c);
    }
  }
  return missing;
}

/** 繁体模式下推荐字体（覆盖率更高时） */
export function suggestFontForTraditional(
  text: string,
  current: CopybookFontChoice,
): CopybookFontChoice | null {
  const options: CopybookFontChoice[] = ["aoyagi", "qiji", "xuandong"];
  const scores = options.map((font) => ({
    font,
    pct: coveragePercentFromText(text, font),
  }));
  scores.sort((a, b) => b.pct - a.pct);
  const best = scores[0];
  if (!best || best.font === current || best.pct < 90) return null;
  const currentPct = coveragePercentFromText(text, current);
  if (best.pct - currentPct < 5) return null;
  return best.font;
}

function coveragePercentFromText(text: string, fontChoice: CopybookFontChoice): number {
  const chars = [...text].filter((c) => c.trim());
  if (chars.length === 0) return 100;
  const charSet = COPYBOOK_CHAR_SETS[fontChoice];
  if (!charSet) return 0;
  let found = 0;
  for (const c of chars) {
    if (charMatchesFont(c, fontChoice, charSet)) found++;
  }
  return Math.round((found / chars.length) * 100);
}
