/**
 * 抄经字符覆盖率检查
 * @author jingxin
 */
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";

export type CoverageResult = {
  total: number;
  found: number;
  missing: string[];
  fontChoice: string;
};

export function checkCoverage(text: string, fontChoice: string): CoverageResult {
  const chars = [...text].filter((c) => c.trim());
  const total = chars.length;
  if (total === 0) return { total: 0, found: 0, missing: [], fontChoice };

  const charSet = COPYBOOK_CHAR_SETS[fontChoice];
  if (!charSet) {
    return { total, found: 0, missing: chars, fontChoice };
  }

  const missing: string[] = [];
  let found = 0;
  for (const c of chars) {
    if (charSet.has(c)) {
      found++;
    } else {
      missing.push(c);
    }
  }

  return { total, found, missing, fontChoice };
}

/** 覆盖率百分比（用于 UI 显示） */
export function coveragePercent(result: CoverageResult): number {
  if (result.total === 0) return 100;
  return Math.round((result.found / result.total) * 100);
}
