/**
 * 地图地名搜索（client-safe，FoJin 对齐）
 * @author 代长亚
 */
import OpenCC from "opencc-js";
import type { KgGeoEntity } from "@/lib/kg/geo";

const s2t = OpenCC.Converter({ from: "cn", to: "tw" });
const t2s = OpenCC.Converter({ from: "tw", to: "cn" });

const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u30FF]/;
const HANGUL_REGEX = /[\uAC00-\uD7AF]/;

export function isChineseGeoName(name: string | null | undefined): boolean {
  if (!name) return false;
  if (HANGUL_REGEX.test(name)) return false;
  return CJK_REGEX.test(name);
}

export function geoQueryVariants(q: string): string[] {
  const trimmed = q.trim().toLowerCase();
  if (!trimmed) return [];
  const variants = new Set<string>([trimmed]);
  try {
    variants.add(t2s(trimmed));
    variants.add(s2t(trimmed));
  } catch {
    /* ignore */
  }
  return [...variants].filter(Boolean);
}

function tokenizeQuery(q: string): string[][] {
  const parts = q.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return [parts];
  const combos: string[][] = [[q]];
  for (let i = 1; i < q.length; i++) {
    combos.push([q.slice(0, i), q.slice(i)]);
  }
  return combos;
}

function entitySearchHaystack(e: KgGeoEntity): string {
  const addr = [e.province, e.city, e.district].filter(Boolean).join("");
  return `${e.name_zh} ${e.name_en ?? ""} ${addr}`.toLowerCase();
}

export function searchGeoEntities(
  pool: KgGeoEntity[],
  query: string,
  max = 30,
): KgGeoEntity[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const queries = geoQueryVariants(q);
  const allTokenSets = queries.flatMap(tokenizeQuery);
  const matches: KgGeoEntity[] = [];
  for (const e of pool) {
    const full = entitySearchHaystack(e);
    const hit = allTokenSets.some((tokens) => tokens.every((t) => full.includes(t)));
    if (hit) {
      matches.push(e);
      if (matches.length >= max) break;
    }
  }
  return matches;
}

export function formatGeoAddress(e: KgGeoEntity): string {
  return [e.province, e.city, e.district].filter(Boolean).join("");
}

export function formatYear(year: number): string {
  if (year < 0) return `公元前${Math.abs(year)}年`;
  return `公元${year}年`;
}

export function formatYearRange(start: number | null, end: number | null): string {
  if (start !== null && end !== null) return `${formatYear(start)} — ${formatYear(end)}`;
  if (start !== null) return `${formatYear(start)} —`;
  if (end !== null) return `— ${formatYear(end)}`;
  return "";
}
