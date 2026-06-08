/**
 * 经目字符倒排索引（对标 cbeta/libhan.py Search）
 * @author 代长亚
 */
import {
  extractCjkChars,
  normalizeSearchQuery,
  normalizeSutraTitleForSearch,
} from "@/lib/search/query-normalize";

export type TitleIndexSutra = {
  sutraId: string;
  cbetaId: string;
  title: string;
};

export type TitleCharIndex = {
  /** 汉字 → 含该字的经目 id 列表 */
  charToSutraIds: Map<string, string[]>;
  sutraById: Map<string, TitleIndexSutra>;
};

export function buildTitleCharIndex(sutras: TitleIndexSutra[]): TitleCharIndex {
  const charToSutraIds = new Map<string, string[]>();
  const sutraById = new Map<string, TitleIndexSutra>();

  for (const sutra of sutras) {
    sutraById.set(sutra.sutraId, sutra);
    const normalized = normalizeSutraTitleForSearch(sutra.title);
    const seen = new Set<string>();
    for (const ch of extractCjkChars(normalized)) {
      if (seen.has(ch)) continue;
      seen.add(ch);
      const list = charToSutraIds.get(ch);
      if (list) list.push(sutra.sutraId);
      else charToSutraIds.set(ch, [sutra.sutraId]);
    }
  }

  return { charToSutraIds, sutraById };
}

export function minCharMatchCount(queryCharCount: number, minRatio = 2 / 3): number {
  if (queryCharCount <= 1) return queryCharCount;
  return Math.max(1, Math.ceil(queryCharCount * minRatio));
}

/**
 * 字符交集经目检索（CBETA Search.search）
 * @param minRatio 对标 Manticore MATCH '/3'，默认至少 2/3 字命中
 */
export function searchTitlesByChars(
  index: TitleCharIndex,
  query: string,
  options?: { minRatio?: number; limit?: number },
): TitleIndexSutra[] {
  const normalized = normalizeSearchQuery(query);
  const chars = extractCjkChars(normalized);
  if (chars.length === 0) return [];

  const minMatch = minCharMatchCount(chars.length, options?.minRatio ?? 2 / 3);
  const limit = options?.limit ?? 50;

  const counts = new Map<string, number>();
  for (const ch of chars) {
    const ids = index.charToSutraIds.get(ch);
    if (!ids) continue;
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const hits: Array<{ sutra: TitleIndexSutra; matched: number }> = [];
  for (const [sutraId, matched] of counts) {
    if (matched < minMatch) continue;
    const sutra = index.sutraById.get(sutraId);
    if (sutra) hits.push({ sutra, matched });
  }

  hits.sort((a, b) => {
    if (b.matched !== a.matched) return b.matched - a.matched;
    return a.sutra.title.localeCompare(b.sutra.title, "zh-CN");
  });

  return hits.slice(0, limit).map((h) => h.sutra);
}
