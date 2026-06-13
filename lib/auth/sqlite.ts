/**
 * 账号库 SQLite 连接（jingxin-auth.db，与语料主库分离）
 * @author 代长亚
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import { applySqlitePragmas } from "@/lib/db/sqlite-pragmas";
import * as schema from "./schema";

export const AUTH_DB_FILENAME = "jingxin-auth.db";

let authSqliteInstance: Database.Database | null = null;

export function resolveAuthDbPath(dataDir?: string): string {
  const dir = dataDir ?? process.env.DATA_DIR ?? "./data";
  return path.join(dir, AUTH_DB_FILENAME);
}

export function getAuthSqlite(): Database.Database {
  if (!authSqliteInstance) {
    const dataDir = process.env.DATA_DIR ?? "./data";
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = resolveAuthDbPath(dataDir);
    authSqliteInstance = new Database(dbPath);
    authSqliteInstance.pragma("journal_mode = WAL");
    applySqlitePragmas(authSqliteInstance);
  }
  return authSqliteInstance;
}

export function closeAuthDb(): void {
  if (authSqliteInstance) {
    authSqliteInstance.close();
    authSqliteInstance = null;
  }
}

export function getAuthDb() {
  return drizzle(getAuthSqlite(), { schema });
}
