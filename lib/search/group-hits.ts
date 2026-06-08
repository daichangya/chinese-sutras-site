/**
 * 段落搜索结果按经折叠（纯函数，client 安全）
 * @author 代长亚
 */
import type { SearchHit } from "@/lib/search/fts-types";
import { compareSutraByCanonRank } from "@/lib/search/sutra-pagerank";
import type { GroupedParagraphHits } from "@/lib/search/types";

/** 段落结果按经折叠（对标 FoJin collapse by text_id） */
export function groupHitsBySutra(hits: SearchHit[]): GroupedParagraphHits[] {
  return groupHitsBySutraWithRank(hits);
}

/** 按 pagerank / wordcount 排序后再折叠 */
export function groupHitsBySutraWithRank(hits: SearchHit[]): GroupedParagraphHits[] {
  const map = new Map<string, GroupedParagraphHits>();
  for (const hit of hits) {
    const existing = map.get(hit.sutraId);
    if (existing) {
      existing.hits.push(hit);
    } else {
      map.set(hit.sutraId, {
        sutraId: hit.sutraId,
        sutraSlug: hit.sutraSlug,
        sutraTitle: hit.sutraTitle,
        cbetaId: hit.cbetaId,
        hits: [hit],
      });
    }
  }

  const groups = [...map.values()];
  groups.sort((a, b) => {
    const wcA = a.hits.reduce((sum, h) => sum + (h.wordcount ?? 0), 0);
    const wcB = b.hits.reduce((sum, h) => sum + (h.wordcount ?? 0), 0);
    if (wcB !== wcA) return wcB - wcA;
    return compareSutraByCanonRank(a.cbetaId, b.cbetaId);
  });

  return groups;
}
