/**
 * 辞典 headword 相关性排序（对齐 fojin 两阶段检索）
 * @author 代长亚
 */
import { s2t, t2s } from "@/lib/han";

/** 简繁变体去重（对齐 fojin _zh_variants） */
export function zhQueryVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const simplified = t2s(trimmed, { backend: "js" }).text;
  const traditional = s2t(trimmed, { backend: "js" }).text;
  return [...new Set([trimmed, simplified, traditional].filter(Boolean))];
}

/** exact=3, prefix=2, substring=1, none=0 */
export function relevanceScore(headword: string, variants: string[]): number {
  for (const v of variants) {
    if (headword === v) return 3;
  }
  for (const v of variants) {
    if (headword.startsWith(v)) return 2;
  }
  for (const v of variants) {
    if (headword.includes(v)) return 1;
  }
  return 0;
}

export function sortByRelevance<T extends { headword: string }>(
  rows: T[],
  variants: string[],
): T[] {
  return [...rows].sort((a, b) => {
    const ra = relevanceScore(a.headword, variants);
    const rb = relevanceScore(b.headword, variants);
    if (rb !== ra) return rb - ra;
    if (a.headword.length !== b.headword.length) return a.headword.length - b.headword.length;
    return a.headword.localeCompare(b.headword, "zh");
  });
}

/** 构建 Phase1 exact/prefix OR 条件 */
export function buildExactPrefixClause(variants: string[]): {
  clause: string;
  params: string[];
} {
  const parts: string[] = [];
  const params: string[] = [];
  for (const v of variants) {
    parts.push("headword = ?");
    params.push(v);
    parts.push("headword LIKE ?");
    params.push(`${v}%`);
  }
  return { clause: parts.join(" OR "), params };
}

/** 构建 Phase2 substring OR 条件 */
export function buildSubstringClause(variants: string[]): {
  clause: string;
  params: string[];
} {
  const parts: string[] = [];
  const params: string[] = [];
  for (const v of variants) {
    parts.push("headword LIKE ?");
    params.push(`%${v}%`);
  }
  return { clause: parts.join(" OR "), params };
}
