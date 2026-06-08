/**
 * 语料库规模统计（首页展示用）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { getCachedCorpusStats } from "@/lib/db/perf-cache";

export type CorpusStats = {
  sutraCount: number;
  paragraphCount: number;
  dictEntryCount: number;
  kgEntityCount: number;
};

export function getCorpusStats(): CorpusStats {
  const cached = getCachedCorpusStats();
  if (cached) return cached;

  const db = getSqlite();
  const sutraCount = (
    db.prepare(`SELECT COUNT(*) as c FROM sutra`).get() as { c: number }
  ).c;
  const paragraphCount = (
    db.prepare(`SELECT COUNT(*) as c FROM paragraph`).get() as { c: number }
  ).c;
  const dictEntryCount = tableExists(db, "dict_entry")
    ? (db.prepare(`SELECT COUNT(*) as c FROM dict_entry`).get() as { c: number }).c
    : 0;
  const kgEntityCount = tableExists(db, "kg_entity")
    ? (db.prepare(`SELECT COUNT(*) as c FROM kg_entity`).get() as { c: number }).c
    : 0;
  return { sutraCount, paragraphCount, dictEntryCount, kgEntityCount };
}

function tableExists(db: ReturnType<typeof getSqlite>, name: string): boolean {
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
}
