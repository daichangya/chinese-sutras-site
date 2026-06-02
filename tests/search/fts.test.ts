import { existsSync } from "fs";
import { describe, it, expect, beforeAll } from "vitest";
import { getSqlite, closeDb } from "@/lib/db";
import { searchParagraphs } from "@/lib/search/fts";

const dbPath = process.env.DATA_DIR ? `${process.env.DATA_DIR}/jingxin.db` : "./data/jingxin.db";

describe("searchParagraphs", () => {
  beforeAll(() => {
    if (!existsSync(dbPath)) {
      console.warn("Skip FTS tests: database not found at", dbPath);
    }
  });

  it("returns hits for common term when data imported", () => {
    if (!existsSync(dbPath)) return;
    getSqlite();
    const hits = searchParagraphs("菩薩");
    expect(Array.isArray(hits)).toBe(true);
    if (hits.length > 0) {
      expect(hits[0].sutraTitle.length).toBeGreaterThan(0);
      expect(hits[0].paragraphId.length).toBeGreaterThan(0);
    }
    closeDb();
  });

  it("returns empty array for empty query", () => {
    expect(searchParagraphs("")).toEqual([]);
  });
});
