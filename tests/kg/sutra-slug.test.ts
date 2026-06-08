/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { closeDb } from "@/lib/db/sqlite";
import { getSutraSlugForTextEntity } from "@/lib/kg/graph";

describe("getSutraSlugForTextEntity", () => {
  let tmpDir: string;
  const prevData = process.env.DATA_DIR;
  const textId = "kg:text:T0220";

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-kg-sutra-slug-"));
    process.env.DATA_DIR = tmpDir;
    const db = new Database(path.join(tmpDir, "jingxin.db"));
    db.exec(`
      CREATE TABLE sutra (id TEXT PRIMARY KEY, cbeta_id TEXT, slug TEXT, title TEXT);
      CREATE TABLE kg_entity (id TEXT PRIMARY KEY, entity_type TEXT, name_zh TEXT, text_id TEXT, source_tier TEXT);
      CREATE TABLE kg_relation (subject_id TEXT, predicate TEXT, object_id TEXT);
    `);
    db.prepare(`INSERT INTO sutra VALUES ('s1', 'T0220', 'xinjing', '心经')`).run();
    db.prepare(`INSERT INTO kg_entity VALUES (?, 'text', '心经', 'T0220', 'derived')`).run(textId);
    db.close();
    closeDb();
  });

  afterEach(() => {
    if (prevData !== undefined) process.env.DATA_DIR = prevData;
    else delete process.env.DATA_DIR;
    closeDb();
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("resolves sutra slug from text entity", () => {
    expect(getSutraSlugForTextEntity(textId)).toBe("xinjing");
  });
});
