/**
 * 账号库建表与从主库 jingxin.db 的一次性迁移
 * @author 代长亚
 */
import type Database from "better-sqlite3";

const AUTH_DDL = `
CREATE TABLE IF NOT EXISTS app_user (
  id TEXT PRIMARY KEY,
  union_id TEXT UNIQUE,
  nickname TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS app_user_union_idx ON app_user(union_id);

CREATE TABLE IF NOT EXISTS oauth_identity (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  openid TEXT NOT NULL,
  union_id TEXT,
  user_id TEXT NOT NULL REFERENCES app_user(id),
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS oauth_identity_provider_openid_idx ON oauth_identity(provider, openid);
CREATE INDEX IF NOT EXISTS oauth_identity_user_idx ON oauth_identity(user_id);

CREATE TABLE IF NOT EXISTS auth_session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_user(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_session_user_idx ON auth_session(user_id);
`;

function tableExists(db: Database.Database, name: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
  return Boolean(row);
}

function tableRowCount(db: Database.Database, table: string): number {
  if (!tableExists(db, table)) return 0;
  const row = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number };
  return row.c;
}

/** 创建账号库表结构 */
export function ensureAuthSchema(authDb: Database.Database): void {
  authDb.exec(AUTH_DDL);
}

/**
 * 若账号库为空且主库仍存有旧版 auth 表，则迁移后从主库删除。
 */
export function migrateAuthFromMainDbIfNeeded(
  authDb: Database.Database,
  mainDb: Database.Database,
): { migrated: boolean; users: number } {
  ensureAuthSchema(authDb);

  if (tableRowCount(authDb, "app_user") > 0) {
    return { migrated: false, users: 0 };
  }
  if (!tableExists(mainDb, "app_user") || tableRowCount(mainDb, "app_user") === 0) {
    return { migrated: false, users: 0 };
  }

  const copy = (table: string, columns: string[]) => {
    if (!tableExists(mainDb, table)) return;
    const colList = columns.join(", ");
    const rows = mainDb.prepare(`SELECT ${colList} FROM ${table}`).all() as Record<
      string,
      unknown
    >[];
    if (rows.length === 0) return;
    const placeholders = columns.map(() => "?").join(", ");
    const insert = authDb.prepare(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`);
    const tx = authDb.transaction((items: Record<string, unknown>[]) => {
      for (const row of items) {
        insert.run(...columns.map((c) => row[c]));
      }
    });
    tx(rows);
  };

  copy("app_user", [
    "id",
    "union_id",
    "nickname",
    "avatar_url",
    "created_at",
    "last_login_at",
  ]);
  copy("oauth_identity", ["id", "provider", "openid", "union_id", "user_id", "created_at"]);
  copy("auth_session", ["id", "user_id", "expires_at", "created_at"]);

  const users = tableRowCount(authDb, "app_user");

  mainDb.exec(`DROP TABLE IF EXISTS auth_session`);
  mainDb.exec(`DROP TABLE IF EXISTS oauth_identity`);
  mainDb.exec(`DROP TABLE IF EXISTS app_user`);

  return { migrated: true, users };
}

/** 主库若仍残留 auth 表（空库或未迁移），直接删除以保持主库纯净 */
export function dropLegacyAuthTablesFromMain(mainDb: Database.Database): void {
  if (!tableExists(mainDb, "app_user")) return;
  mainDb.exec(`DROP TABLE IF EXISTS auth_session`);
  mainDb.exec(`DROP TABLE IF EXISTS oauth_identity`);
  mainDb.exec(`DROP TABLE IF EXISTS app_user`);
}
