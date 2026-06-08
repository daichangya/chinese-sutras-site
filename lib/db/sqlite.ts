/**
 * SQLite 连接（脚本与 server 共用，无 server-only）
 * @author 代长亚
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { applySqlitePragmas } from "./sqlite-pragmas";
import * as schema from "./schema";

let sqliteInstance: Database.Database | null = null;

export function getSqlite() {
  if (!sqliteInstance) {
    const dataDir = process.env.DATA_DIR ?? "./data";
    const dbPath = path.join(dataDir, "jingxin.db");
    sqliteInstance = new Database(dbPath);
    sqliteInstance.pragma("journal_mode = WAL");
    applySqlitePragmas(sqliteInstance);
  }
  return sqliteInstance;
}

export function closeDb() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
  }
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}
