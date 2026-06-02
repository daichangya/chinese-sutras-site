/**
 * SQLite 连接（单机 VPS + 本地文件）
 * @author jingxin
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

let sqliteInstance: Database.Database | null = null;

export function getSqlite() {
  if (!sqliteInstance) {
    const dataDir = process.env.DATA_DIR ?? "./data";
    const dbPath = path.join(dataDir, "jingxin.db");
    sqliteInstance = new Database(dbPath);
    sqliteInstance.pragma("journal_mode = WAL");
  }
  return sqliteInstance;
}

export function getDb() {
  return drizzle(getSqlite(), { schema });
}

export function closeDb() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
  }
}
