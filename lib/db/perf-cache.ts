/**
 * 性能预计算表读写（corpus_stats / sutra_colloquial / kg_geo_flat）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import type { CorpusStats } from "@/lib/stats/corpus-stats";

export function hasPerfCacheTables(): boolean {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('corpus_stats', 'sutra_colloquial', 'kg_geo_flat')`,
    )
    .all() as Array<{ name: string }>;
  return row.length >= 3;
}

export function getCachedCorpusStats(): CorpusStats | null {
  const db = getSqlite();
  if (!tableExists(db, "corpus_stats")) return null;
  const row = db
    .prepare(
      `SELECT sutra_count as sutraCount, paragraph_count as paragraphCount,
              dict_entry_count as dictEntryCount, kg_entity_count as kgEntityCount
       FROM corpus_stats WHERE id = 'main'`,
    )
    .get() as CorpusStats | undefined;
  return row ?? null;
}

export function listColloquialSutraIds(): string[] {
  const db = getSqlite();
  if (!tableExists(db, "sutra_colloquial")) return [];
  const rows = db
    .prepare(`SELECT sutra_id as sutraId FROM sutra_colloquial`)
    .all() as Array<{ sutraId: string }>;
  return rows.map((r) => r.sutraId);
}

function tableExists(db: ReturnType<typeof getSqlite>, name: string): boolean {
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
}
