/**
 * 阅读器默认仅返回正文段落
 * @author 代长亚
 */
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetParagraphSchemaCache } from "@/lib/db/paragraph-schema";

let testDb: Database.Database;

vi.mock("@/lib/db/sqlite", () => ({
  getSqlite: () => testDb,
  closeDb: () => {},
}));

function seedDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE sutra (
      id TEXT PRIMARY KEY,
      cbeta_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      translator TEXT,
      category TEXT,
      char_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE paragraph (
      id TEXT PRIMARY KEY,
      sutra_id TEXT NOT NULL,
      juan_seq INTEGER NOT NULL DEFAULT 0,
      seq INTEGER NOT NULL,
      text TEXT NOT NULL,
      colloquial TEXT,
      block_role TEXT
    );
    INSERT INTO sutra VALUES ('s1', 'T08n0251', 'xinjing', '心经', '玄奘', NULL, 100);
    INSERT INTO paragraph VALUES ('p1', 's1', 0, 1, '二仪久判', NULL, 'preface');
    INSERT INTO paragraph VALUES ('p2', 's1', 0, 2, '夫法性无边', NULL, 'preface');
    INSERT INTO paragraph VALUES ('p3', 's1', 0, 3, '观自在菩萨行深般若波罗蜜多时', NULL, 'body');
    INSERT INTO paragraph VALUES ('p4', 's1', 0, 4, '舍利子色不异空', NULL, 'body');
  `);
}

describe("getParagraphsForSutra body filter", () => {
  beforeEach(() => {
    resetParagraphSchemaCache();
    testDb = new Database(":memory:");
    seedDb(testDb);
  });

  afterEach(() => {
    resetParagraphSchemaCache();
    testDb.close();
  });

  it("returns only body paragraphs by default", async () => {
    const { getParagraphsForSutra, getAuxiliaryParagraphsForSutra } = await import(
      "@/lib/sutra/queries"
    );
    const body = getParagraphsForSutra("s1");
    expect(body).toHaveLength(2);
    expect(body[0]!.text).toContain("观自在菩萨");
    expect(body.every((p) => p.blockRole === "body")).toBe(true);

    const auxiliary = getAuxiliaryParagraphsForSutra("s1");
    expect(auxiliary).toHaveLength(2);
    expect(auxiliary.every((p) => p.blockRole === "preface")).toBe(true);
  });

  it("includes auxiliary when includeAuxiliary=true", async () => {
    const { getParagraphsForSutra } = await import("@/lib/sutra/queries");
    const all = getParagraphsForSutra("s1", undefined, { includeAuxiliary: true });
    expect(all).toHaveLength(4);
  });
});
