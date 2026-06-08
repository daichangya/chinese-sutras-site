/**
 * 统一搜索：经目 + 段落 + 辞典 + 人物（server-only）
 * @author 代长亚
 */
import "server-only";

import { flattenGroupedDictionary, lookupDictionaryGrouped } from "@/lib/db/dict-kg";
import { getSqlite } from "@/lib/db";
import { searchKgEntities } from "@/lib/kg/search";
import { detectScript, t2s } from "@/lib/han";
import { buildParagraphFtsQuery, buildSutraFtsQuery } from "@/lib/search/fts-query";
import { searchParagraphs } from "@/lib/search/fts";
import { resolveSearchIntent } from "@/lib/search/query-intent";
import { normalizeSearchQuery } from "@/lib/search/query-normalize";
import { mergeSutraHits } from "@/lib/search/score-sutra";
import {
  buildTitleCharIndex,
  searchTitlesByChars,
  type TitleCharIndex,
} from "@/lib/search/title-index";
import type {
  DictSearchHit,
  PersonSearchHit,
  SutraSearchHit,
  UnifiedSearchResult,
} from "@/lib/search/types";

export type {
  DictSearchHit,
  GroupedParagraphHits,
  PersonSearchHit,
  SutraSearchHit,
  UnifiedSearchResult,
} from "@/lib/search/types";

export { groupHitsBySutra, groupHitsBySutraWithRank } from "@/lib/search/group-hits";

let titleIndexCache: TitleCharIndex | null = null;

function getTitleIndex(db: ReturnType<typeof getSqlite>): TitleCharIndex {
  if (titleIndexCache) return titleIndexCache;
  const rows = db
    .prepare(`SELECT id as sutraId, cbeta_id as cbetaId, title FROM sutra`)
    .all() as Array<{ sutraId: string; cbetaId: string; title: string }>;
  titleIndexCache = buildTitleCharIndex(rows);
  return titleIndexCache;
}

function toSimplifiedForDb(text: string): string {
  if (detectScript(text) === "traditional") {
    return t2s(text, { backend: "js" }).text;
  }
  return text;
}

function fetchSutraByCbetaId(db: ReturnType<typeof getSqlite>, cbetaId: string): SutraSearchHit[] {
  const row = db
    .prepare(
      `SELECT id as sutraId, slug as sutraSlug, title, translator, category, cbeta_id as cbetaId
       FROM sutra WHERE upper(cbeta_id) = upper(?) LIMIT 1`,
    )
    .get(cbetaId) as SutraSearchHit | undefined;
  return row ? [row] : [];
}

function fetchSutrasByTitlePrefix(
  db: ReturnType<typeof getSqlite>,
  titlePrefix: string,
  limit: number,
): SutraSearchHit[] {
  const simplified = toSimplifiedForDb(titlePrefix);
  return db
    .prepare(
      `SELECT id as sutraId, slug as sutraSlug, title, translator, category, cbeta_id as cbetaId
       FROM sutra WHERE title LIKE ? OR title LIKE ?
       LIMIT ?`,
    )
    .all(`${simplified}%`, `${titlePrefix}%`, limit) as SutraSearchHit[];
}

/** 经名完全一致（含多译者同名经目） */
function fetchSutrasByExactTitle(
  db: ReturnType<typeof getSqlite>,
  title: string,
  limit: number,
): SutraSearchHit[] {
  const simplified = toSimplifiedForDb(title);
  return db
    .prepare(
      `SELECT id as sutraId, slug as sutraSlug, title, translator, category, cbeta_id as cbetaId
       FROM sutra
       WHERE title = ? OR title = ?
       ORDER BY cbeta_id
       LIMIT ?`,
    )
    .all(simplified, title, limit) as SutraSearchHit[];
}

function isTitleLikeQuery(normalized: string, cjkChars: string[]): boolean {
  return (
    cjkChars.length >= 4 &&
    (normalized.endsWith("经") || normalized.endsWith("论") || normalized.endsWith("論"))
  );
}

/** 同名多译者：标题完全一致的经目优先排在前面 */
function prioritizeExactTitleHits(
  hits: SutraSearchHit[],
  titleQuery: string,
  limit: number,
): SutraSearchHit[] {
  const simplified = toSimplifiedForDb(titleQuery);
  const exact = hits.filter((h) => h.title === simplified || h.title === titleQuery);
  if (exact.length <= 1) return hits.slice(0, limit);

  const exactIds = new Set(exact.map((h) => h.sutraId));
  const rest = hits.filter((h) => !exactIds.has(h.sutraId));
  const merged = [...exact, ...rest];
  const seen = new Set<string>();
  const out: SutraSearchHit[] = [];
  for (const hit of merged) {
    if (seen.has(hit.sutraId)) continue;
    seen.add(hit.sutraId);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

function hydrateSutraHits(
  db: ReturnType<typeof getSqlite>,
  sutraIds: string[],
): SutraSearchHit[] {
  if (sutraIds.length === 0) return [];
  const placeholders = sutraIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id as sutraId, slug as sutraSlug, title, translator, category, cbeta_id as cbetaId
       FROM sutra WHERE id IN (${placeholders})`,
    )
    .all(...sutraIds) as SutraSearchHit[];
  const byId = new Map(rows.map((r) => [r.sutraId, r]));
  return sutraIds.map((id) => byId.get(id)).filter(Boolean) as SutraSearchHit[];
}

function searchSutrasViaFts(
  db: ReturnType<typeof getSqlite>,
  query: string,
  limit: number,
): SutraSearchHit[] {
  const ftsQuery = buildSutraFtsQuery(query);
  if (!ftsQuery) return [];
  try {
    return db
      .prepare(
        `SELECT s.id as sutraId, s.slug as sutraSlug, s.title, s.translator, s.category, s.cbeta_id as cbetaId
         FROM sutra_fts f
         JOIN sutra s ON s.id = f.sutra_id
         WHERE sutra_fts MATCH ?
         LIMIT ?`,
      )
      .all(ftsQuery, limit * 3) as SutraSearchHit[];
  } catch {
    return [];
  }
}

function searchSutrasViaLike(
  db: ReturnType<typeof getSqlite>,
  query: string,
  limit: number,
): SutraSearchHit[] {
  const like = `%${query}%`;
  return db
    .prepare(
      `SELECT id as sutraId, slug as sutraSlug, title, translator, category, cbeta_id as cbetaId
       FROM sutra
       WHERE title LIKE ? OR translator LIKE ? OR cbeta_id LIKE ? OR category LIKE ?
       LIMIT ?`,
    )
    .all(like, like, like, like, limit) as SutraSearchHit[];
}

export function searchSutras(query: string, limit = 12): SutraSearchHit[] {
  const intent = resolveSearchIntent(query);
  const trimmed = intent.normalizedQuery;
  if (!trimmed && intent.mode !== "cbeta_id") return [];

  const db = getSqlite();
  const batches: Parameters<typeof mergeSutraHits>[0] = [];

  if (intent.mode === "cbeta_id" && intent.cbetaId) {
    batches.push({ hits: fetchSutraByCbetaId(db, intent.cbetaId), source: "cbeta_id" });
  }

  const titleQuery = trimmed || query;
  if (isTitleLikeQuery(titleQuery, intent.cjkChars)) {
    batches.push({
      hits: fetchSutrasByExactTitle(db, titleQuery, limit * 2),
      source: "title_exact",
    });
  }

  if (intent.canonicalTitle) {
    batches.push({
      hits: fetchSutrasByTitlePrefix(db, intent.canonicalTitle, limit * 2),
      source: "alias",
    });
    if (intent.aliasCbetaId) {
      batches.push({
        hits: fetchSutraByCbetaId(db, intent.aliasCbetaId),
        source: "alias",
      });
    }
  }

  const titleIndex = getTitleIndex(db);
  const charHits = searchTitlesByChars(titleIndex, trimmed || query, { limit: limit * 3 });
  if (charHits.length > 0) {
    const matched = intent.cjkChars.length > 0 ? charHits[0] : undefined;
    const charMatchRatio = matched
      ? Math.min(1, intent.cjkChars.filter((ch) => matched.title.includes(ch)).length / intent.cjkChars.length)
      : 0;
    batches.push({
      hits: hydrateSutraHits(
        db,
        charHits.map((h) => h.sutraId),
      ),
      source: "char_index",
      charMatchRatio,
    });
  }

  const hasFts = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='sutra_fts'`)
    .get();
  if (hasFts) {
    batches.push({
      hits: searchSutrasViaFts(db, trimmed || query, limit),
      source: "fts",
    });
  }

  const merged = mergeSutraHits(batches);
  if (merged.length > 0) {
    return isTitleLikeQuery(titleQuery, intent.cjkChars)
      ? prioritizeExactTitleHits(merged, titleQuery, limit)
      : merged.slice(0, limit);
  }

  return searchSutrasViaLike(db, trimmed, limit).slice(0, limit);
}

export function searchPersons(query: string, limit = 8): PersonSearchHit[] {
  const { results } = searchKgEntities({
    q: query,
    entityType: "person",
    limit,
    strictType: true,
  });
  return results
    .filter((r) => r.entity_type === "person")
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      nameZh: r.name_zh,
      nameEn: r.name_en,
      relationCount: r.relation_count,
      dynasty: r.dynasty,
    }));
}

export function searchDictionary(query: string, limit = 8): DictSearchHit[] {
  const grouped = lookupDictionaryGrouped(query, { size: limit, resultCap: limit * 4 });
  return flattenGroupedDictionary(grouped, limit).map((e) => ({
    id: e.id,
    source: e.source,
    headword: e.headword,
    definition: e.definition,
  }));
}

export function unifiedSearch(query: string): UnifiedSearchResult {
  const intent = resolveSearchIntent(query);
  const trimmed = intent.normalizedQuery;
  if (!trimmed && intent.mode !== "cbeta_id") {
    return { sutras: [], paragraphs: [], dictionary: [], persons: [] };
  }

  const sutras = searchSutras(query, 12);
  const paragraphs = searchParagraphs(trimmed || query, 30, {
    cjkChars: intent.cjkChars,
    sutraRankHint: sutras.map((s) => s.cbetaId),
  });

  return {
    sutras,
    paragraphs,
    dictionary: searchDictionary(trimmed, 8),
    persons: searchPersons(trimmed, 8),
  };
}
