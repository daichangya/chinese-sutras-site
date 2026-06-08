/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { getKgSubgraph } from "@/lib/kg/graph";

describe("getKgSubgraph BFS", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-bfs-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE kg_entity (
        id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT,
        source_tier TEXT, source TEXT
      );
      CREATE TABLE kg_relation (
        subject_id TEXT, predicate TEXT, object_id TEXT,
        confidence REAL, source TEXT
      );
    `);
    db.prepare(`INSERT INTO kg_entity VALUES ('p1', 'person', '玄奘', 'authoritative', 'dila')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('p2', 'person', '弟子', 'authoritative', 'dila')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('t1', 'text', '心经', 'derived', 'corpus')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES ('h1', 'person', '未知', 'heuristic', 'corpus')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'teacher_of', 'p2', 1, 'dila')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('p1', 'translated', 't1', 1, 'corpus')`).run();
    db.prepare(`INSERT INTO kg_relation VALUES ('h1', 'translated', 't1', 0.5, 'corpus')`).run();
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("excludes heuristic persons from subgraph", () => {
    const g = getKgSubgraph({ centerId: "p1", depth: 2, limit: 50 });
    const ids = g.nodes.map((n) => n.id);
    expect(ids).toContain("p1");
    expect(ids).toContain("p2");
    expect(ids).not.toContain("h1");
  });

  it("filters by predicate", () => {
    const g = getKgSubgraph({
      centerId: "p1",
      depth: 1,
      limit: 50,
      predicates: ["teacher_of"],
    });
    expect(g.edges.every((e) => e.predicate === "teacher_of")).toBe(true);
  });
});
