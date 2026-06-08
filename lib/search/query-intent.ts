/**
 * 搜索意图路由（经号 / 别名 / 经目 / 正文）
 * @author 代长亚
 */
import { normalizeCbetaId } from "@/lib/cbeta/corpus-category";
import { extractCjkChars, normalizeSearchQuery } from "@/lib/search/query-normalize";
import { resolveAliasCbetaId, resolveSutraAlias } from "@/lib/search/sutra-aliases";

export type SearchIntentMode = "cbeta_id" | "alias" | "title" | "content" | "mixed";

export type SearchIntent = {
  mode: SearchIntentMode;
  normalizedQuery: string;
  cbetaId?: string;
  canonicalTitle?: string;
  aliasCbetaId?: string;
  cjkChars: string[];
};

const CBETA_ID_RE = /^([A-Za-z]+\d+n[\dA-Za-z_]+)$/i;

export function parseCbetaIdQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const m = trimmed.match(CBETA_ID_RE);
  if (!m) return null;
  return normalizeCbetaId(m[1]!);
}

export function resolveSearchIntent(rawQuery: string): SearchIntent {
  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const cjkChars = extractCjkChars(normalizedQuery);

  const cbetaId = parseCbetaIdQuery(normalizedQuery);
  if (cbetaId) {
    return { mode: "cbeta_id", normalizedQuery, cbetaId, cjkChars };
  }

  const canonicalTitle = resolveSutraAlias(normalizedQuery) ?? resolveSutraAlias(rawQuery.trim());
  const aliasCbetaId = resolveAliasCbetaId(normalizedQuery) ?? resolveAliasCbetaId(rawQuery.trim());

  if (canonicalTitle) {
    return {
      mode: "alias",
      normalizedQuery,
      canonicalTitle,
      aliasCbetaId: aliasCbetaId ?? undefined,
      cjkChars,
    };
  }

  const isShortTitleLike =
    cjkChars.length > 0 &&
    cjkChars.length <= 8 &&
    (normalizedQuery.endsWith("经") || normalizedQuery.endsWith("論") || normalizedQuery.endsWith("论"));

  if (isShortTitleLike) {
    return { mode: "title", normalizedQuery, cjkChars };
  }

  if (cjkChars.length <= 4 && cjkChars.length > 0) {
    return { mode: "mixed", normalizedQuery, cjkChars };
  }

  return { mode: "content", normalizedQuery, cjkChars };
}
