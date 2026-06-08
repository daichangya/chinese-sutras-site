/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { isTemplePlaceName, searchKgEntities, zhQueryVariants } from "@/lib/kg/search";

describe("searchKgEntities", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-search-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, name_en TEXT,
        properties TEXT, source_tier TEXT, source TEXT
      );
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    db.prepare(
      `INSERT INTO kg_entity VALUES ('p1', 'person', '玄奘', 'Xuanzang', NULL, 'authoritative', 'dila')`,
    ).run();
    db.prepare(
      `INSERT INTO kg_entity VALUES ('p2', 'person', '玄奘', NULL, NULL, 'authoritative', 'dila')`,
    ).run();
    db.prepare(
      `INSERT INTO kg_entity VALUES ('h1', 'person', '玄奘', NULL, NULL, 'heuristic', 'corpus')`,
    ).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'translated', 't1')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'translated', 't2')`).run();
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns multiple同名人物 for disambiguation", () => {
    const { results } = searchKgEntities({ q: "玄奘", limit: 10 });
    expect(results.length).toBe(2);
    expect(results.every((r) => r.source_tier !== "heuristic")).toBe(true);
  });

  it("includes slug in results", () => {
    const { results } = searchKgEntities({ q: "玄奘", limit: 1 });
    expect(results[0]!.slug).toBeTruthy();
    expect(results[0]!.relation_count).toBeGreaterThan(0);
  });

  it("monastery filter includes temple-named places", () => {
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.prepare(
      `INSERT INTO kg_entity VALUES ('pl1', 'place', '白马寺', NULL, '{"province":"河南"}', 'authoritative', 'dila')`,
    ).run();
    db.close();
    closeDb();

    const { results } = searchKgEntities({ q: "白马寺", entityType: "monastery", limit: 10 });
    expect(results.some((r) => r.name_zh === "白马寺")).toBe(true);
    expect(results[0]!.region_hint).toBe("河南");
  });

  it("relaxes type filter when no matches", () => {
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.prepare(
      `INSERT INTO kg_entity VALUES ('s1', 'school', '禅宗', 'Chan', NULL, 'authoritative', 'seed')`,
    ).run();
    db.close();
    closeDb();

    const { results, relaxedType } = searchKgEntities({ q: "禅宗", entityType: "person", limit: 10 });
    expect(relaxedType).toBe(true);
    expect(results.some((r) => r.entity_type === "school")).toBe(true);
  });

  it("strictType keeps person filter when no person matches", () => {
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.prepare(
      `INSERT INTO kg_entity VALUES ('kg:text:T08n0254', 'text', '般若波罗蜜多心经', NULL, NULL, 'derived', 'corpus')`,
    ).run();
    db.close();
    closeDb();

    const relaxed = searchKgEntities({ q: "般若波罗蜜多心经", entityType: "person", limit: 10 });
    expect(relaxed.relaxedType).toBe(true);
    expect(relaxed.results.some((r) => r.entity_type === "text")).toBe(true);

    const strict = searchKgEntities({
      q: "般若波罗蜜多心经",
      entityType: "person",
      limit: 10,
      strictType: true,
    });
    expect(strict.relaxedType).toBeUndefined();
    expect(strict.results).toHaveLength(0);
  });

  it("zhQueryVariants includes simplified and traditional forms", () => {
    const variants = zhQueryVariants("禅");
    expect(variants.length).toBeGreaterThanOrEqual(1);
  });

  it("isTemplePlaceName detects temple suffixes", () => {
    expect(isTemplePlaceName("白马寺")).toBe(true);
    expect(isTemplePlaceName("少林寺")).toBe(true);
    expect(isTemplePlaceName("五台山")).toBe(false);
  });
});
