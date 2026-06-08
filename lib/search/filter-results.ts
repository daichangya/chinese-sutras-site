/**
 * 统一搜索结果客户端筛选（纯函数）
 * @author 代长亚
 */
import type { UnifiedSearchResult } from "@/lib/search/types";

export type SearchFilters = {
  categories: string[];
  colloquialOnly: boolean;
};

export function extractSearchCategories(results: UnifiedSearchResult): string[] {
  const set = new Set<string>();
  for (const s of results.sutras) {
    if (s.category) set.add(s.category);
  }
  for (const p of results.paragraphs) {
    const s = results.sutras.find((x) => x.sutraId === p.sutraId);
    if (s?.category) set.add(s.category);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function applySearchFilters(
  results: UnifiedSearchResult,
  filters: SearchFilters,
  colloquialSutraIds?: Set<string>,
): UnifiedSearchResult {
  let { sutras, paragraphs, dictionary, persons } = results;

  if (filters.colloquialOnly && colloquialSutraIds && colloquialSutraIds.size > 0) {
    sutras = sutras.filter((s) => colloquialSutraIds.has(s.sutraId));
    paragraphs = paragraphs.filter((p) => colloquialSutraIds.has(p.sutraId));
  }

  if (filters.categories.length > 0) {
    const allowed = new Set(filters.categories);
    sutras = sutras.filter((s) => s.category && allowed.has(s.category));
    const allowedSutraIds = new Set(sutras.map((s) => s.sutraId));
    paragraphs = paragraphs.filter((p) => allowedSutraIds.has(p.sutraId));
  }

  return { sutras, paragraphs, dictionary, persons };
}
