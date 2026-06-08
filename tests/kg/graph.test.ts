/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { getSutrasForPerson, resolveKgCenterId } from "@/lib/kg/graph";

describe("getSutrasForPerson", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;
  const personId = "kg:person:dila:test";
  const textId = "kg:text:T0220";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-graph-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE sutra (
        id TEXT PRIMARY KEY, cbeta_id TEXT, slug TEXT, title TEXT
      );
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, text_id TEXT
      );
      CREATE TABLE kg_relation (
        subject_id TEXT, predicate TEXT, object_id TEXT
      );
    `);
    db.prepare(`INSERT INTO sutra VALUES ('s1', 'T0220', 'xinjing', '般若波罗蜜多心经')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES (?, 'person', '玄奘', NULL)`).run(personId);
    db.prepare(`INSERT INTO kg_entity VALUES (?, 'text', '心经', 'T0220')`).run(textId);
    db.prepare(
      `INSERT INTO kg_relation VALUES (?, 'translated', ?)`,
    ).run(personId, textId);
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns sutras linked via translated relation", () => {
    const sutras = getSutrasForPerson(personId);
    expect(sutras).toHaveLength(1);
    expect(sutras[0]!.slug).toBe("xinjing");
    expect(sutras[0]!.cbetaId).toBe("T0220");
  });
});

describe("resolveKgCenterId", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-resolve-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, source_tier TEXT);
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    db.prepare(`INSERT INTO kg_entity VALUES ('p1', 'person', '玄奘', 'authoritative')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('p2', 'person', '鸠摩罗什', 'authoritative')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('t1', 'text', '心经', 'derived')`).run();
    db.prepare(
      `INSERT INTO kg_entity VALUES ('kg:school:seed:华严宗', 'school', '华严宗', 'authoritative')`,
    ).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'translated', 't1')`).run();
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves person name to entity id", () => {
    expect(resolveKgCenterId("玄奘")).toBe("p1");
  });

  it("resolves traditional query to simplified stored name", () => {
    expect(resolveKgCenterId("鳩摩羅什")).toBe("p2");
  });

  it("returns undefined for unknown query", () => {
    expect(resolveKgCenterId("不存在的人物")).toBeUndefined();
  });

  it("resolves seed school slug to school entity id", () => {
    expect(resolveKgCenterId("seed-华严宗")).toBe("kg:school:seed:华严宗");
  });

  it("resolves school name with type hint", () => {
    expect(resolveKgCenterId("华严宗", "school")).toBe("kg:school:seed:华严宗");
  });
});
