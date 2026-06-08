/**
 * SQLite 繁简抽样审计（用户面应存简体）
 * @author 代长亚
 */
import type Database from "better-sqlite3";
import { detectScript } from "@/lib/han";
import { paragraphHasTextColumn } from "@/lib/db/paragraph-schema";

export type ScriptAuditResult = {
  sampleSize: number;
  paragraphTraditional: number;
  sutraTitleTraditional: number;
  dictHeadwordTraditional: number;
  kgNameTraditional: number;
  kgDescriptionTraditional: number;
};

function countTraditionalInSample(texts: string[]): number {
  let n = 0;
  for (const t of texts) {
    const s = detectScript(t);
    if (s === "traditional" || s === "mixed") n += 1;
  }
  return n;
}

function sampleTexts(db: Database.Database, sql: string, limit: number): string[] {
  const rows = db.prepare(sql).all(limit) as Array<{ t: string }>;
  return rows.map((r) => r.t).filter(Boolean);
}

/** 抽样检测 DB 中是否仍含明显繁体（相对入库简体约定） */
export function auditDbSimplifiedStorage(
  db: Database.Database,
  sampleSize = 200,
): ScriptAuditResult {
  const limit = Math.max(1, sampleSize);
  const hasParagraph = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='paragraph'`)
    .get();
  const hasSutra = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='sutra'`)
    .get();
  const hasDict = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='dict_entry'`)
    .get();
  const hasKg = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get();

  const paragraphTexts =
    hasParagraph && paragraphHasTextColumn(db)
      ? sampleTexts(
          db,
          `SELECT substr(text, 1, 800) as t FROM paragraph ORDER BY RANDOM() LIMIT ?`,
          limit,
        )
      : [];
  const titleTexts = hasSutra
    ? sampleTexts(db, `SELECT title as t FROM sutra ORDER BY RANDOM() LIMIT ?`, limit)
    : [];
  const headwords = hasDict
    ? sampleTexts(
        db,
        `SELECT headword as t FROM dict_entry WHERE lang = 'zh' ORDER BY RANDOM() LIMIT ?`,
        limit,
      )
    : [];
  const kgNames = hasKg
    ? sampleTexts(
        db,
        `SELECT name_zh as t FROM kg_entity WHERE name_zh IS NOT NULL ORDER BY RANDOM() LIMIT ?`,
        limit,
      )
    : [];
  const kgDescriptions = hasKg
    ? sampleTexts(
        db,
        `SELECT json_extract(properties, '$.description') as t
         FROM kg_entity
         WHERE json_extract(properties, '$.description') IS NOT NULL
         ORDER BY RANDOM() LIMIT ?`,
        limit,
      )
    : [];

  return {
    sampleSize: limit,
    paragraphTraditional: countTraditionalInSample(paragraphTexts),
    sutraTitleTraditional: countTraditionalInSample(titleTexts),
    dictHeadwordTraditional: countTraditionalInSample(headwords),
    kgNameTraditional: countTraditionalInSample(kgNames),
    kgDescriptionTraditional: countTraditionalInSample(kgDescriptions),
  };
}
