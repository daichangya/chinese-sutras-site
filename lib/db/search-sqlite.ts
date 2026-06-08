/**
 * 检索专用 SQLite（paragraph_fts）
 * @author 代长亚
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { applySqlitePragmas } from "./sqlite-pragmas";

let searchInstance: Database.Database | null = null;

export function resolveSearchDbPath(dataDir?: string): string {
  const dir = dataDir ?? process.env.DATA_DIR ?? "./data";
  return path.join(dir, "jingxin-search.db");
}

/** 确保检索库目录存在并返回连接 */
export function getSearchSqlite(): Database.Database {
  if (!searchInstance) {
    const dataDir = process.env.DATA_DIR ?? "./data";
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = resolveSearchDbPath(dataDir);
    searchInstance = new Database(dbPath);
    searchInstance.pragma("journal_mode = WAL");
    applySqlitePragmas(searchInstance);
  }
  return searchInstance;
}

export function closeSearchDb(): void {
  if (searchInstance) {
    searchInstance.close();
    searchInstance = null;
  }
}

/** FTS 表是否含反规范化列（v2） */
export function paragraphFtsHasDenormColumns(db: Database.Database): boolean {
  const row = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='paragraph_fts'`,
    )
    .get() as { sql: string } | undefined;
  if (!row?.sql) return false;
  return row.sql.includes("sutra_slug");
}

/** 创建检索库 FTS 表（v2：含经目元数据，搜索零 JOIN） */
export function ensureSearchSchema(db: Database.Database): void {
  if (paragraphFtsHasDenormColumns(db)) return;
  db.exec(`DROP TABLE IF EXISTS paragraph_fts;`);
  db.exec(`
CREATE VIRTUAL TABLE paragraph_fts USING fts5(
  paragraph_id UNINDEXED,
  sutra_id UNINDEXED,
  sutra_slug UNINDEXED,
  sutra_title,
  cbeta_id UNINDEXED,
  seq UNINDEXED,
  text,
  tokenize='unicode61'
);
`);
}

let paragraphFtsDbCache: Database.Database | null = null;

function ftsHasAnyRow(db: Database.Database): boolean {
  const has = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='paragraph_fts'`)
    .get();
  if (!has) return false;
  const row = db.prepare(`SELECT 1 FROM paragraph_fts LIMIT 1`).get();
  return !!row;
}

/**
 * 用于 paragraph_fts 查询的连接：优先检索库，迁移过渡期可回退主库旧 FTS。
 */
export function getParagraphFtsDb(mainDb: Database.Database): Database.Database {
  if (paragraphFtsDbCache) return paragraphFtsDbCache;

  const search = getSearchSqlite();
  ensureSearchSchema(search);
  if (ftsHasAnyRow(search)) {
    paragraphFtsDbCache = search;
    return search;
  }
  if (ftsHasAnyRow(mainDb)) {
    paragraphFtsDbCache = mainDb;
    return mainDb;
  }
  paragraphFtsDbCache = search;
  return search;
}

export function resetParagraphFtsDbCache(): void {
  paragraphFtsDbCache = null;
}
