import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

describe("share table", () => {
  let db: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;
  const testDbPath = path.join(process.cwd(), "data", "test-share.db");

  beforeEach(() => {
    fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
    sqlite = new Database(testDbPath);
    db = drizzle(sqlite, { schema });

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sutra (
        id TEXT PRIMARY KEY, cbeta_id TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
        translator TEXT, category TEXT, char_count INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS paragraph (
        id TEXT PRIMARY KEY, sutra_id TEXT NOT NULL REFERENCES sutra(id),
        juan_seq INTEGER NOT NULL DEFAULT 0, seq INTEGER NOT NULL,
        text TEXT NOT NULL, start_ref TEXT, end_ref TEXT,
        parser_pid TEXT, content_hash TEXT,
        colloquial TEXT, commentary TEXT, lecture TEXT
      );
      CREATE TABLE IF NOT EXISTS share (
        id TEXT PRIMARY KEY, sutra_id TEXT NOT NULL,
        paragraph_id TEXT NOT NULL, share_code TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0
      );
    `);
  });

  afterEach(() => {
    sqlite.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  it("creates a share record", () => {
    sqlite.exec(`INSERT INTO sutra (id, cbeta_id, slug, title) VALUES ('s1', 'T01n0001', 'test-sutra', 'Test Sutra')`);
    sqlite.exec(`INSERT INTO paragraph (id, sutra_id, seq, text) VALUES ('p1', 's1', 1, 'Hello world')`);

    const inserted = db
      .insert(schema.share)
      .values({
        id: "share_123_abc",
        sutraId: "s1",
        paragraphId: "p1",
        shareCode: "ABC12345",
        excerpt: "Hello world",
        createdAt: 123,
      })
      .returning()
      .get();

    expect(inserted.shareCode).toBe("ABC12345");
    expect(inserted.excerpt).toBe("Hello world");
    expect(inserted.viewCount).toBe(0);
  });

  it("finds share by code", () => {
    sqlite.exec(`INSERT INTO sutra (id, cbeta_id, slug, title) VALUES ('s1', 'T01n0001', 'test-sutra', 'Test Sutra')`);
    sqlite.exec(`INSERT INTO paragraph (id, sutra_id, seq, text) VALUES ('p1', 's1', 1, 'Hello world')`);
    sqlite.exec(`INSERT INTO share (id, sutra_id, paragraph_id, share_code, excerpt, created_at) VALUES ('share_123_abc', 's1', 'p1', 'XYZ99999', 'Hello world', 123)`);

    const result = db
      .select()
      .from(schema.share)
      .where(eq(schema.share.shareCode, "XYZ99999"))
      .get();

    expect(result).toBeDefined();
    expect(result?.shareCode).toBe("XYZ99999");
  });

  it("increments view count", () => {
    sqlite.exec(`INSERT INTO sutra (id, cbeta_id, slug, title) VALUES ('s1', 'T01n0001', 'test-sutra', 'Test Sutra')`);
    sqlite.exec(`INSERT INTO paragraph (id, sutra_id, seq, text) VALUES ('p1', 's1', 1, 'Hello world')`);
    sqlite.exec(`INSERT INTO share (id, sutra_id, paragraph_id, share_code, excerpt, created_at, view_count) VALUES ('share_123_abc', 's1', 'p1', 'VIEW0001', 'Hello world', 123, 5)`);

    db.update(schema.share)
      .set({ viewCount: sql`${schema.share.viewCount} + 1` })
      .where(eq(schema.share.shareCode, "VIEW0001"))
      .run();

    const result = db
      .select()
      .from(schema.share)
      .where(eq(schema.share.shareCode, "VIEW0001"))
      .get();

    expect(result?.viewCount).toBe(6);
  });
});
