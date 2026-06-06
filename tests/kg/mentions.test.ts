/**
 * @author jingxin
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { getKgEntityMentions } from "@/lib/kg/mentions";

describe("getKgEntityMentions", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-mentions-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, source_tier TEXT, properties TEXT
      );
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    db.prepare(
      `INSERT INTO kg_entity VALUES ('p1', 'person', '玄奘', 'authoritative', ?)`,
    ).run(JSON.stringify({ description: "玄奘法师西行求法，师从戒贤，译经无数。" }));
    db.prepare(`INSERT INTO kg_entity VALUES ('p2', 'person', '戒贤', 'authoritative', NULL)`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('p3', 'person', '鸠摩罗什', 'authoritative', NULL)`).run();
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds entity names mentioned in description", () => {
    const mentions = getKgEntityMentions("p1");
    const names = mentions.map((m) => m.name_zh);
    expect(names).toContain("戒贤");
    expect(names).not.toContain("玄奘");
  });

  it("excludes self and short names", () => {
    const mentions = getKgEntityMentions("p1");
    expect(mentions.every((m) => m.id !== "p1")).toBe(true);
    expect(mentions.every((m) => m.name_zh.length >= 2)).toBe(true);
  });

  it("returns empty for unknown slug", () => {
    expect(getKgEntityMentions("missing")).toEqual([]);
  });
});
