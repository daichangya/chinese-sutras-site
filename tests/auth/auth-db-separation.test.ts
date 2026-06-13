/**
 * 账号库与主库分离
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureAuthSchema,
  migrateAuthFromMainDbIfNeeded,
} from "@/lib/auth/ensure-schema";
import { AUTH_DB_FILENAME } from "@/lib/auth/sqlite";

describe("auth database separation", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-auth-split-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("migrates legacy auth tables from jingxin.db to jingxin-auth.db", () => {
    const mainPath = path.join(tmpDir, "jingxin.db");
    const authPath = path.join(tmpDir, AUTH_DB_FILENAME);
    const mainDb = new Database(mainPath);
    const authDb = new Database(authPath);

    mainDb.exec(`
      CREATE TABLE app_user (
        id TEXT PRIMARY KEY,
        union_id TEXT,
        nickname TEXT,
        avatar_url TEXT,
        created_at INTEGER NOT NULL,
        last_login_at INTEGER NOT NULL
      );
      INSERT INTO app_user VALUES ('u1', 'union1', '测试', NULL, 1, 1);
    `);

    const result = migrateAuthFromMainDbIfNeeded(authDb, mainDb);
    expect(result.migrated).toBe(true);
    expect(result.users).toBe(1);

    const user = authDb.prepare(`SELECT nickname FROM app_user WHERE id='u1'`).get() as {
      nickname: string;
    };
    expect(user.nickname).toBe("测试");

    const legacy = mainDb
      .prepare(`SELECT 1 FROM sqlite_master WHERE name='app_user'`)
      .get();
    expect(legacy).toBeUndefined();

    mainDb.close();
    authDb.close();
  });

  it("ensureAuthSchema creates empty auth db", () => {
    const authPath = path.join(tmpDir, AUTH_DB_FILENAME);
    const authDb = new Database(authPath);
    ensureAuthSchema(authDb);
    const tables = authDb
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(["app_user", "oauth_identity", "auth_session"]),
    );
    authDb.close();
  });
});
