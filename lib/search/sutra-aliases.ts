/**
 * 经目简称 → 正典全名（移植 fojin ABBREV，键统一为简体）
 * @author 代长亚
 */
import { detectScript, t2s } from "@/lib/han";
import { MVP_CANON } from "@/lib/cbeta/mvp-canon";

/** fojin search.py ABBREV，值保留繁体正典名供 LIKE/标题匹配 */
const ABBREV_RAW: Record<string, string> = {
  金刚经: "金剛般若波羅蜜經",
  金剛經: "金剛般若波羅蜜經",
  心经: "般若波羅蜜多心經",
  心經: "般若波羅蜜多心經",
  法华经: "妙法蓮華經",
  法華經: "妙法蓮華經",
  华严经: "大方廣佛華嚴經",
  華嚴經: "大方廣佛華嚴經",
  楞严经: "大佛頂如來密因修證了義諸菩薩萬行首楞嚴經",
  楞嚴經: "大佛頂如來密因修證了義諸菩薩萬行首楞嚴經",
  圆觉经: "大方廣圓覺修多羅了義經",
  圓覺經: "大方廣圓覺修多羅了義經",
  楞伽经: "入楞伽經",
  楞伽經: "入楞伽經",
  维摩经: "維摩詰所說經",
  維摩經: "維摩詰所說經",
  地藏经: "地藏菩薩本願經",
  地藏經: "地藏菩薩本願經",
  药师经: "藥師琉璃光如來本願功德經",
  藥師經: "藥師琉璃光如來本願功德經",
  阿弥陀经: "佛說阿彌陀經",
  阿彌陀經: "佛說阿彌陀經",
  无量寿经: "佛說無量壽經",
  無量壽經: "佛說無量壽經",
  涅盘经: "大般涅槃經",
  涅槃經: "大般涅槃經",
  般若经: "大般若波羅蜜多經",
  般若經: "大般若波羅蜜多經",
  长阿含经: "長阿含經",
  长阿含經: "長阿含經",
  中阿含经: "中阿含經",
  杂阿含经: "雜阿含經",
  增一阿含经: "增壹阿含經",
  坛经: "六祖大師法寶壇經",
  壇經: "六祖大師法寶壇經",
};

function aliasKey(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) return "";
  if (detectScript(trimmed) === "traditional") {
    return t2s(trimmed, { backend: "js" }).text;
  }
  return trimmed;
}

const ABBREV_SIMPLIFIED: Record<string, string> = Object.fromEntries(
  Object.entries(ABBREV_RAW).map(([k, v]) => [aliasKey(k), v]),
);

/** MVP 经目 cbeta_id → 常见简称（补充 pagerank 顶部经） */
const MVP_ALIAS_BY_CBETA = new Map(
  MVP_CANON.flatMap((e) => {
    const rows: Array<[string, string]> = [[e.cbetaId.toUpperCase(), e.title]];
    if (e.cbetaId === "T08n0235") rows.push([e.cbetaId, "金刚经"]);
    if (e.cbetaId === "T08n0251") rows.push([e.cbetaId, "心经"]);
    return rows;
  }),
);

/** 简称 → 正典全名（繁体）；未命中返回 null */
export function resolveSutraAlias(query: string): string | null {
  const key = aliasKey(query);
  if (!key) return null;
  return ABBREV_SIMPLIFIED[key] ?? null;
}

/** 别名对应的 MVP cbeta_id（若已知） */
export function resolveAliasCbetaId(query: string): string | null {
  const canonical = resolveSutraAlias(query);
  if (!canonical) return null;
  const hit = MVP_CANON.find(
    (e) => e.title === canonical || t2s(e.title, { backend: "js" }).text === t2s(canonical, { backend: "js" }).text,
  );
  return hit?.cbetaId ?? null;
}

export function listSutraAliasKeys(): string[] {
  return Object.keys(ABBREV_SIMPLIFIED);
}

export function getMvpAliasByCbetaId(cbetaId: string): string | undefined {
  return MVP_ALIAS_BY_CBETA.get(cbetaId.toUpperCase());
}
