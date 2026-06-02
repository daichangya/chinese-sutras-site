import { existsSync } from "fs";
import { describe, it, expect, afterAll } from "vitest";
import { MVP_CANON } from "@/lib/cbeta/mvp-canon";
import { listMvpSutras } from "@/lib/canon/popular";
import { closeDb } from "@/lib/db";

const dbPath = process.env.DATA_DIR ? `${process.env.DATA_DIR}/jingxin.db` : "./data/jingxin.db";

describe("listMvpSutras", () => {
  afterAll(() => {
    closeDb();
  });

  it("returns empty array when database is missing", () => {
    if (existsSync(dbPath)) return;
    expect(listMvpSutras()).toEqual([]);
  });

  it("finds MVP sutras by cbeta_id when corpus is imported", () => {
    if (!existsSync(dbPath)) return;
    const sutras = listMvpSutras();
    expect(sutras.length).toBeGreaterThan(0);
    expect(sutras.length).toBeLessThanOrEqual(MVP_CANON.length);
    for (const s of sutras) {
      expect(s.slug.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
    }
  });
});
