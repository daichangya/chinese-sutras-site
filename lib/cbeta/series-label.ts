/**
 * CBETA 藏系列显示名（与 CBETA 典籍代码表对齐）
 * @see https://www.cbeta.org/cbreader/help/id.htm
 * @author jingxin
 */

/** 藏代码 → 语料顶层目录名（较长代码须写在短代码之前，由 seriesCodeFromCbetaId 最长匹配） */
export const CBETA_SERIES_LABELS: Record<string, string> = {
  GA: "佛寺史志汇刊",
  GB: "佛寺志丛刊",
  CC: "中华藏",
  LC: "乾隆藏",
  TX: "太虚藏",
  ZW: "藏外佛教文献",
  ZS: "正史佛教资料",
  YP: "演培法师全集",
  A: "赵城藏",
  B: "补编",
  C: "中华藏",
  D: "国图藏",
  F: "房山石经",
  G: "佛教大藏",
  I: "北朝佛拓",
  J: "嘉兴藏",
  K: "高丽藏",
  L: "乾隆藏",
  M: "卍正藏",
  N: "南传",
  P: "永乐北藏",
  Q: "磧砂藏",
  R: "卍续藏",
  S: "宋藏遗珍",
  T: "大正藏",
  U: "洪武南藏",
  X: "卍续藏",
  Y: "印顺藏",
  Z: "卍续藏",
};

const SERIES_CODES_LONGEST_FIRST = Object.keys(CBETA_SERIES_LABELS).sort(
  (a, b) => b.length - a.length,
);

/** 从 cbeta_id 提取藏代码（最长前缀匹配，避免 GA 被当成 G） */
export function seriesCodeFromCbetaId(cbetaId: string): string | undefined {
  const upper = cbetaId.trim().toUpperCase();
  for (const code of SERIES_CODES_LONGEST_FIRST) {
    if (upper.startsWith(code)) return code;
  }
  const m = upper.match(/^([A-Z]+)/);
  return m?.[1];
}

export function categoryFromCbetaId(cbetaId: string): string | undefined {
  const series = seriesCodeFromCbetaId(cbetaId);
  if (!series) return undefined;
  return CBETA_SERIES_LABELS[series] ?? series;
}

export function slugFromCbetaId(cbetaId: string): string {
  return cbetaId.toLowerCase();
}

/** 历史错误目录名 → 当前规范目录名（用于迁移旧 corpus） */
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  安吉藏: "赵城藏",
  丹阳藏: "国图藏",
  GA: "佛寺史志汇刊",
  GB: "佛寺志丛刊",
  I: "北朝佛拓",
};
