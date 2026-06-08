/**
 * 辞典与 KG SQLite 查询（server-only）
 * @author 代长亚
 */
import "server-only";

import type Database from "better-sqlite3";
import {
  buildExactPrefixClause,
  buildSubstringClause,
  sortByRelevance,
  zhQueryVariants,
} from "@/lib/dictionaries/lookup-rank";
import {
  compareDictionarySourceOrder,
  getDictionarySourceLabel,
} from "@/lib/dictionaries/sources";
import { normalizeUserZhQuery } from "@/lib/han/storage-normalize";
import { getSqlite } from "./index";

export type DictLookupRow = {
  id: string;
  source: string;
  headword: string;
  definition: string;
  reading: string | null;
  lang: string;
  definitionHtml?: string | null;
};

type RawDictRow = DictLookupRow & { entry_data?: string | null };

function parseDefinitionHtml(entryData: string | null | undefined): string | null {
  if (!entryData) return null;
  try {
    const data = JSON.parse(entryData) as { definition_html?: unknown };
    const html = data.definition_html;
    return typeof html === "string" && html.trim() ? html : null;
  } catch {
    return null;
  }
}

function mapDictRow(row: RawDictRow): DictLookupRow {
  return {
    id: row.id,
    source: row.source,
    headword: row.headword,
    definition: row.definition,
    reading: row.reading,
    lang: row.lang,
    definitionHtml: parseDefinitionHtml(row.entry_data),
  };
}

export type DictGroupedResult = {
  query: string;
  total: number;
  groups: Array<{
    source: string;
    sourceName: string;
    total: number;
    entries: DictLookupRow[];
  }>;
};

const PHASE1_MIN = 5;
const RESULT_CAP = 200;

type LookupOptions = {
  source?: string;
  resultCap?: number;
};

function selectEntries(
  db: Database.Database,
  whereClause: string,
  params: unknown[],
  sourceFilter?: string,
): DictLookupRow[] {
  const sourceSql = sourceFilter ? " AND source = ?" : "";
  const allParams = sourceFilter ? [...params, sourceFilter] : params;
  return db
    .prepare(
      `SELECT id, source, headword, definition, reading, lang, entry_data
       FROM dict_entry
       WHERE lang = 'zh' AND (${whereClause})${sourceSql}`,
    )
    .all(...allParams)
    .map((row) => mapDictRow(row as RawDictRow));
}

function mergeUnique(existing: DictLookupRow[], more: DictLookupRow[]): DictLookupRow[] {
  const seen = new Set(existing.map((r) => r.id));
  const out = [...existing];
  for (const row of more) {
    if (!seen.has(row.id)) {
      out.push(row);
      seen.add(row.id);
    }
  }
  return out;
}

function lookupViaFts(
  db: Database.Database,
  q: string,
  limit: number,
  sourceFilter?: string,
): DictLookupRow[] {
  const hasFts = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='dict_entry_fts'`)
    .get();
  if (!hasFts) return [];
  try {
    const ftsQuery = q.length === 1 ? `"${q}"` : q.split(/\s+/).map((t) => `"${t}"`).join(" OR ");
    if (sourceFilter) {
      return db
        .prepare(
          `SELECT e.id, e.source, e.headword, e.definition, e.reading, e.lang, e.entry_data
           FROM dict_entry_fts f
           JOIN dict_entry e ON e.rowid = f.rowid
           WHERE dict_entry_fts MATCH ? AND e.lang = 'zh' AND e.source = ?
           ORDER BY bm25(dict_entry_fts)
           LIMIT ?`,
        )
        .all(ftsQuery, sourceFilter, limit)
        .map((row) => mapDictRow(row as RawDictRow));
    }
    return db
      .prepare(
        `SELECT e.id, e.source, e.headword, e.definition, e.reading, e.lang, e.entry_data
         FROM dict_entry_fts f
         JOIN dict_entry e ON e.rowid = f.rowid
         WHERE dict_entry_fts MATCH ? AND e.lang = 'zh'
         ORDER BY bm25(dict_entry_fts)
         LIMIT ?`,
      )
      .all(ftsQuery, limit)
      .map((row) => mapDictRow(row as RawDictRow));
  } catch {
    return [];
  }
}

/** fojin 风格两阶段 headword 检索 */
export function searchDictionaryHeadwords(
  query: string,
  options?: LookupOptions,
): DictLookupRow[] {
  const q = normalizeUserZhQuery(query);
  if (q.length < 1) return [];

  const db = getSqlite();
  const sourceFilter = options?.source?.trim();
  const cap = options?.resultCap ?? RESULT_CAP;
  const variants = zhQueryVariants(q);

  const phase1 = buildExactPrefixClause(variants);
  let rows = selectEntries(db, phase1.clause, phase1.params, sourceFilter);
  rows = sortByRelevance(rows, variants);

  if (rows.length < PHASE1_MIN) {
    const phase2 = buildSubstringClause(variants);
    const subRows = selectEntries(db, phase2.clause, phase2.params, sourceFilter);
    rows = sortByRelevance(mergeUnique(rows, subRows), variants);
  }

  if (rows.length === 0) {
    rows = lookupViaFts(db, q, cap, sourceFilter);
  }

  return rows.slice(0, cap);
}

export function lookupDictionaryEntries(
  query: string,
  limit = 8,
  source?: string,
): DictLookupRow[] {
  return searchDictionaryHeadwords(query, { source, resultCap: limit }).slice(0, limit);
}

/** 按来源分组；每组最多 size 条 */
export function lookupDictionaryGrouped(
  query: string,
  options?: { source?: string; size?: number; resultCap?: number },
): DictGroupedResult {
  const q = normalizeUserZhQuery(query);
  const size = Math.min(Math.max(options?.size ?? 10, 1), 50);
  const resultCap = Math.min(Math.max(options?.resultCap ?? RESULT_CAP, size), RESULT_CAP);
  const rows = searchDictionaryHeadwords(query, {
    source: options?.source,
    resultCap,
  });

  const bySource = new Map<string, DictLookupRow[]>();
  for (const row of rows) {
    const list = bySource.get(row.source) ?? [];
    if (list.length < size) {
      list.push(row);
      bySource.set(row.source, list);
    }
  }

  const sources = [...bySource.keys()].sort(compareDictionarySourceOrder);
  const groups = sources.map((source) => {
    const entries = bySource.get(source) ?? [];
    return {
      source,
      sourceName: getDictionarySourceLabel(source),
      total: entries.length,
      entries,
    };
  });

  return {
    query: q,
    total: rows.length,
    groups,
  };
}

/** 分组结果轮询扁平化，避免单一来源占满 limit */
export function flattenGroupedDictionary(
  grouped: DictGroupedResult,
  limit: number,
): DictLookupRow[] {
  const out: DictLookupRow[] = [];
  const indices = grouped.groups.map(() => 0);

  while (out.length < limit) {
    let added = false;
    for (let g = 0; g < grouped.groups.length; g++) {
      const group = grouped.groups[g]!;
      const entry = group.entries[indices[g]!];
      if (entry) {
        out.push(entry);
        indices[g] = indices[g]! + 1;
        added = true;
        if (out.length >= limit) break;
      }
    }
    if (!added) break;
  }
  return out;
}

export function listDictionarySources(): Array<{
  code: string;
  nameZh: string;
  entryCount: number;
}> {
  const db = getSqlite();
  const hasTable = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='dict_source'`)
    .get();
  if (!hasTable) return [];
  const rows = db
    .prepare(
      `SELECT code, name_zh as nameZh, entry_count as entryCount
       FROM dict_source
       WHERE entry_count > 0`,
    )
    .all() as Array<{ code: string; nameZh: string; entryCount: number }>;
  return rows.sort(
    (a, b) =>
      compareDictionarySourceOrder(a.code, b.code) ||
      b.entryCount - a.entryCount,
  );
}

export type KgPersonRow = {
  id: string;
  name_zh: string;
  name_en: string | null;
  properties: string | null;
};

export function findPersonByName(name: string): KgPersonRow | null {
  const key = normalizeUserZhQuery(name);
  if (!key) return null;
  const db = getSqlite();
  return (
    (db
      .prepare(
        `SELECT id, name_zh, name_en, properties
         FROM kg_entity
         WHERE entity_type = 'person'
           AND source_tier != 'heuristic'
           AND (name_zh = ? OR name_zh LIKE ?)
         ORDER BY (
           SELECT COUNT(*) FROM kg_relation r WHERE r.subject_id = kg_entity.id OR r.object_id = kg_entity.id
         ) DESC
         LIMIT 1`,
      )
      .get(key, `%${key}%`) as KgPersonRow | undefined) ?? null
  );
}

export function findPersonById(id: string): KgPersonRow | null {
  const db = getSqlite();
  return (
    (db
      .prepare(
        `SELECT id, name_zh, name_en, properties FROM kg_entity
         WHERE id = ? AND entity_type = 'person' AND source_tier != 'heuristic'`,
      )
      .get(id) as KgPersonRow | undefined) ?? null
  );
}

export function findTranslatorForSutra(cbetaId: string): {
  person: KgPersonRow | null;
  translatorLabel: string | null;
} {
  const db = getSqlite();
  const sutra = db.prepare(`SELECT translator FROM sutra WHERE cbeta_id = ?`).get(cbetaId) as
    | { translator: string | null }
    | undefined;
  const label = sutra?.translator ?? null;
  if (!label) return { person: null, translatorLabel: null };

  const rel = db
    .prepare(
      `SELECT r.subject_id FROM kg_relation r
       JOIN kg_entity e ON e.id = r.subject_id
       WHERE r.predicate = 'translated' AND r.object_id = ?
         AND e.entity_type = 'person' AND e.source_tier != 'heuristic'
       ORDER BY r.confidence DESC LIMIT 1`,
    )
    .get(`kg:text:${cbetaId}`) as { subject_id: string } | undefined;
  if (rel?.subject_id) {
    const person = findPersonById(rel.subject_id);
    if (person) return { person, translatorLabel: label };
  }
  return { person: findPersonByName(label.split(/[、,，]/)[0]!.trim()), translatorLabel: label };
}
