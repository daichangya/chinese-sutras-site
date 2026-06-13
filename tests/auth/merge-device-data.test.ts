/**
 * 认证：deviceKey 校验与数据合并
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db";
import { isValidDeviceKey } from "@/lib/auth/require-user";
import { mergeDeviceDataToUser } from "@/lib/auth/merge-device-data";

function seedAuthDb(dbPath: string) {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE reading_progress (
      user_key TEXT NOT NULL,
      sutra_id TEXT NOT NULL,
      paragraph_id TEXT NOT NULL,
      scroll_y REAL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_key, sutra_id)
    );
    CREATE TABLE user_bookmark_sync (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      sutra_id TEXT NOT NULL,
      sutra_slug TEXT,
      sutra_title TEXT,
      paragraph_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE user_annotation (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      sutra_id TEXT NOT NULL,
      paragraph_id TEXT NOT NULL,
      start_offset INTEGER DEFAULT 0,
      end_offset INTEGER DEFAULT 0,
      quote TEXT,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE reading_history (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      sutra_id TEXT NOT NULL,
      sutra_slug TEXT,
      sutra_title TEXT,
      paragraph_id TEXT,
      visited_at INTEGER NOT NULL
    );
  `);
  db.close();
}

describe("isValidDeviceKey", () => {
  it("accepts dev_* keys", () => {
    expect(isValidDeviceKey("dev_123_abc")).toBe(true);
  });

  it("rejects forged user ids", () => {
    expect(isValidDeviceKey("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
    expect(isValidDeviceKey("")).toBe(false);
    expect(isValidDeviceKey(undefined)).toBe(false);
  });
});

describe("mergeDeviceDataToUser", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-auth-"));
    prevDataDir = process.env.DATA_DIR;
    process.env.DATA_DIR = tmpDir;
    closeDb();
    seedAuthDb(path.join(tmpDir, "jingxin.db"));
  });

  afterEach(() => {
    process.env.DATA_DIR = prevDataDir;
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("migrates device rows to user id", () => {
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    const deviceKey = "dev_test_merge_1";
    const userId = "user-uuid-1";
    db.prepare(
      `INSERT INTO reading_progress (user_key, sutra_id, paragraph_id, scroll_y, updated_at)
       VALUES (?, 's1', 'p1', 0, 1)`,
    ).run(deviceKey);
    db.prepare(
      `INSERT INTO user_bookmark_sync (id, user_key, sutra_id, sutra_slug, sutra_title, created_at)
       VALUES ('b1', ?, 's1', 'slug', 'title', 1)`,
    ).run(deviceKey);
    db.close();

    const result = mergeDeviceDataToUser(userId, deviceKey);
    expect(result.readingProgress).toBe(1);
    expect(result.bookmarks).toBe(1);

    const after = new Database(path.join(tmpDir, "jingxin.db"));
    const row = after
      .prepare(`SELECT user_key FROM reading_progress WHERE sutra_id = 's1'`)
      .get() as { user_key: string };
    expect(row.user_key).toBe(userId);
    after.close();
  });
});
