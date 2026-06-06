/**
 * @author jingxin
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { getKgStats } from "@/lib/kg/graph";

describe("getKgStats relationCounts", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-stats-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, source_tier TEXT);
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    db.prepare(`INSERT INTO kg_entity VALUES ('p1', 'person', '玄奘', 'authoritative')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('t1', 'text', '心经', 'derived')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'translated', 't1')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'teacher_of', 'p1')`).run();
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns relationCounts grouped by predicate", () => {
    const stats = getKgStats();
    expect(stats.relationCounts.translated).toBe(1);
    expect(stats.relationCounts.teacher_of).toBe(1);
    expect(stats.relationCount).toBe(2);
    expect(stats.totalEntities).toBe(2);
  });
});
