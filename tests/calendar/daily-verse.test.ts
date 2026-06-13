/**
 * 节日今日经句回落
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db/sqlite";

describe("resolveDailyVerse", () => {
  let tmpDir: string;
  let prevDataDir: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-cal-"));
    prevDataDir = process.env.DATA_DIR;
    process.env.DATA_DIR = tmpDir;
    closeDb();
  });

  async function ensureDailyVerseTable() {
    const { getSqlite } = await import("@/lib/db");
    const db = getSqlite();
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_verse (
        id TEXT PRIMARY KEY,
        verse_date TEXT NOT NULL UNIQUE,
        paragraph_id TEXT,
        custom_text TEXT,
        ai_summary TEXT,
        snippet_text TEXT,
        source_title TEXT
      );
    `);
  }

  afterEach(() => {
    process.env.DATA_DIR = prevDataDir;
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns festival fallback on major festival without cache", async () => {
    await ensureDailyVerseTable();
    const { resolveDailyVerse } = await import("@/lib/calendar/daily-verse");
    const resolved = resolveDailyVerse("2026-05-24");
    expect(resolved.festival?.id).toBe("buddha-birthday");
    expect(resolved.source).toBe("festival_fallback");
    expect(resolved.needsAiRefresh).toBe(true);
    expect(resolved.verseText.length).toBeGreaterThan(0);
  });

  it("returns daily verse on ordinary day", async () => {
    await ensureDailyVerseTable();
    const { getSqlite } = await import("@/lib/db");
    const db = getSqlite();
    db.prepare(
      `INSERT INTO daily_verse (id, verse_date, custom_text) VALUES ('daily-2026-06-13', '2026-06-13', '测试经句')`,
    ).run();

    const { resolveDailyVerse } = await import("@/lib/calendar/daily-verse");
    const resolved = resolveDailyVerse("2026-06-13");
    expect(resolved.source).toBe("daily_verse");
    expect(resolved.verseText).toBe("测试经句");
    expect(resolved.festival).toBeNull();
  });
});
