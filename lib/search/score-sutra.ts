/**
 * 经目命中打分与排序（pagerank + MVP + 衍生文本惩罚）
 * @author 代长亚
 */
import {
  compareSutraByCanonRank,
  getCanonSortKey,
  isMvpCanonCbetaId,
  isPagerankDownranked,
} from "@/lib/search/sutra-pagerank";
import type { SutraSearchHit } from "@/lib/search/types";

const DERIVATIVE_TITLE_RE =
  /科仪|科儀|灵验|靈验|靈驗|讲记|講記|讲|講|疏|论|論|赞|贊|记|記|御注|功德记|功德記|义记|義記|挟注|挾注|宣演|注解|註解|灵验记|靈驗記|傳外|传外/;

export type SutraHitSource = "cbeta_id" | "alias" | "title_exact" | "char_index" | "fts" | "like";

export type ScoredSutraHit = SutraSearchHit & {
  score: number;
  source: SutraHitSource;
};

export function scoreSutraHit(
  hit: SutraSearchHit,
  source: SutraHitSource,
  options?: { aliasBoost?: boolean; charMatchRatio?: number },
): number {
  let score = 1000 - Math.min(getCanonSortKey(hit.cbetaId), 999_000) / 1000;

  if (source === "cbeta_id") score += 500;
  if (source === "alias" || options?.aliasBoost) score += 300;
  if (source === "title_exact") score += 320;
  if (source === "char_index") score += 150 + (options?.charMatchRatio ?? 0) * 50;
  if (source === "fts") score += 80;
  if (isMvpCanonCbetaId(hit.cbetaId)) score += 100;
  if (isPagerankDownranked(hit.cbetaId)) score -= 400;
  if (DERIVATIVE_TITLE_RE.test(hit.title)) score -= 250;

  return score;
}

export function sortScoredSutraHits(hits: ScoredSutraHit[]): ScoredSutraHit[] {
  return [...hits].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return compareSutraByCanonRank(a.cbetaId, b.cbetaId);
  });
}

export function mergeSutraHits(
  batches: Array<{ hits: SutraSearchHit[]; source: SutraHitSource; charMatchRatio?: number }>,
): SutraSearchHit[] {
  const byId = new Map<string, ScoredSutraHit>();

  for (const batch of batches) {
    for (const hit of batch.hits) {
      const scored: ScoredSutraHit = {
        ...hit,
        source: batch.source,
        score: scoreSutraHit(hit, batch.source, {
          charMatchRatio: batch.charMatchRatio,
          aliasBoost: batch.source === "alias",
        }),
      };
      const existing = byId.get(hit.sutraId);
      if (!existing || scored.score > existing.score) {
        byId.set(hit.sutraId, scored);
      }
    }
  }

  return sortScoredSutraHits([...byId.values()]).map(({ score: _s, source: _src, ...hit }) => hit);
}

/** 段落 snippet 内 query 汉字出现次数（wordcount 近似） */
export function countQueryHitsInText(text: string, queryChars: string[]): number {
  if (queryChars.length === 0) return 0;
  let total = 0;
  for (const ch of queryChars) {
    let idx = 0;
    while (true) {
      const found = text.indexOf(ch, idx);
      if (found === -1) break;
      total += 1;
      idx = found + 1;
    }
  }
  return total;
}
