/**
 * FTS5 查询构建（CJK 前缀 + 去标点）
 * @author 代长亚
 */
import { extractCjkChars, normalizeSearchQuery } from "@/lib/search/query-normalize";

function escapeFtsToken(token: string): string {
  return token.replace(/['"]/g, "").replace(/[^\p{L}\p{N}_]/gu, "");
}

/**
 * 经目 FTS 查询：中文按字前缀 OR，英文按词短语
 * 例：「金刚经」→ 金* OR 刚* OR 经*
 */
export function buildSutraFtsQuery(rawQuery: string): string | null {
  const normalized = normalizeSearchQuery(rawQuery);
  if (!normalized) return null;

  const cjk = extractCjkChars(normalized);
  if (cjk.length > 0) {
    const terms = [...new Set(cjk)]
      .map((ch) => escapeFtsToken(ch))
      .filter(Boolean)
      .map((t) => `${t}*`);
    if (terms.length === 0) return null;
    return terms.join(" OR ");
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => `"${escapeFtsToken(w)}"`).join(" ");
}

/**
 * 段落 FTS：连续 CJK 用短语；多词用 AND；否则字前缀 OR
 */
export function buildParagraphFtsQuery(rawQuery: string): string | null {
  const normalized = normalizeSearchQuery(rawQuery);
  if (!normalized) return null;

  if (normalized.includes(" ")) {
    const words = normalized.split(/\s+/).filter(Boolean);
    return words.map((w) => `"${escapeFtsToken(w)}"`).join(" AND ");
  }

  const cjk = extractCjkChars(normalized);
  if (cjk.length > 0) {
    if (cjk.join("") === normalized) {
      return `"${escapeFtsToken(normalized)}"`;
    }
    const terms = [...new Set(cjk)]
      .map((ch) => escapeFtsToken(ch))
      .filter(Boolean)
      .map((t) => `${t}*`);
    return terms.length > 0 ? terms.join(" OR ") : null;
  }

  return `"${escapeFtsToken(normalized)}"`;
}

/** @deprecated 旧短语匹配，CJK 会 0 命中 */
export function buildLegacyPhraseFtsQuery(rawQuery: string): string | null {
  const normalized = normalizeSearchQuery(rawQuery);
  if (!normalized) return null;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => `"${escapeFtsToken(w)}"`).join(" ");
}
