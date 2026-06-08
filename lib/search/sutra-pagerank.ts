/**
 * CBETA pagerank 正典排序表（data/sutra-pagerank.json）
 * @author 代长亚
 */
import pagerankData from "@/data/sutra-pagerank.json";
import { getMvpSlugByCbetaId, MVP_CANON } from "@/lib/cbeta/mvp-canon";

type PagerankPayload = {
  order: Record<string, number>;
  downrank: string[];
};

const payload = pagerankData as PagerankPayload;
const ORDER = payload.order;
const DOWNRANK = new Set(payload.downrank.map((id) => id.toUpperCase()));
const MVP_CBETA = new Set(MVP_CANON.map((e) => e.cbetaId.toUpperCase()));

const FALLBACK_RANK = 800_000;

/** pagerank 序位，越小越靠前；未收录返回 null */
export function getPagerankOrder(cbetaId: string): number | null {
  const id = cbetaId.toUpperCase();
  if (id in ORDER) return ORDER[id]!;
  return null;
}

export function isPagerankDownranked(cbetaId: string): boolean {
  return DOWNRANK.has(cbetaId.toUpperCase());
}

export function isMvpCanonCbetaId(cbetaId: string): boolean {
  return MVP_CBETA.has(cbetaId.toUpperCase());
}

/**
 * 综合排序键：pagerank → MVP → cbeta_id 字典序
 * 返回值越小越靠前
 */
export function compareSutraByCanonRank(aCbetaId: string, bCbetaId: string): number {
  const rankA = getCanonSortKey(aCbetaId);
  const rankB = getCanonSortKey(bCbetaId);
  if (rankA !== rankB) return rankA - rankB;
  return aCbetaId.localeCompare(bCbetaId, "en");
}

export function getCanonSortKey(cbetaId: string): number {
  const id = cbetaId.toUpperCase();
  const pr = getPagerankOrder(id);
  if (pr != null) return pr;
  if (isMvpCanonCbetaId(id)) return 700_000;
  return FALLBACK_RANK;
}

export { getMvpSlugByCbetaId };
